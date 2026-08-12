import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrinterEvent } from '../enums/printer-events.enum';
import { PrinterAgent } from '../interfaces/printer-agent.interface';
import { PrintJob } from '../interfaces/print-job.interface';
import { RegisterAgentDto } from '../dto/register-agent.dto';
import { PrintResultDto } from '../dto/print-result.dto';


import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@WebSocketGateway({
  /**
   * Namespace dedicado para Print Agents.
   * O Agent deve conectar em: ws://<host>/printer
   */
  namespace: '/printer',

  cors: {
    /**
     * Em produção, restrinja para o domínio do Print Agent.
     * Por ora aceita qualquer origem, pois o Agent roda localmente.
     */
    origin: '*',
  },
})
export class PrinterGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(PrinterGateway.name);

  /**
   * Mapa de agents conectados, indexado pelo socketId.
   */
  private readonly connectedAgents = new Map<string, PrinterAgent>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  onModuleInit(): void {
    // Varredura a cada 60s para remover agents inativos (sem heartbeat por mais de 90s)
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const TIMEOUT_MS = 90000; // 90 segundos

      for (const [socketId, agent] of this.connectedAgents.entries()) {
        const elapsed = now - agent.lastHeartbeat.getTime();
        if (elapsed > TIMEOUT_MS) {
          this.logger.warn(
            `⚠️ Agent inativo removido (zombie connection) — deviceId: ${agent.deviceId} | sem heartbeat há ${Math.round(elapsed / 1000)}s`,
          );
          this.connectedAgents.delete(socketId);
          try {
            const socket = this.server.sockets.sockets.get(socketId);
            socket?.disconnect(true);
          } catch { /* ignora */ }
        }
      }
    }, 60000);
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }


  // ─── Ciclo de vida da conexão ────────────────────────────────────────────────

  handleConnection(client: Socket): void {
    const expectedToken = process.env.PRINTER_AGENT_TOKEN;
    const token = client.handshake.auth?.token || client.handshake.headers?.['x-agent-token'];

    if (expectedToken && token !== expectedToken) {
      this.logger.warn(
        `⛔ Conexão de Print Agent rejeitada — token inválido | socketId: ${client.id} | ip: ${client.handshake.address}`,
      );
      client.disconnect(true);
      return;
    }

    this.logger.log(
      `Print Agent conectado — socketId: ${client.id} | ip: ${client.handshake.address}`,
    );
  }

  handleDisconnect(client: Socket): void {
    const agent = this.connectedAgents.get(client.id);

    if (agent) {
      this.logger.warn(
        `Print Agent desconectado — deviceId: ${agent.deviceId} | storeId: ${agent.storeId}`,
      );
      this.connectedAgents.delete(client.id);
    } else {
      this.logger.warn(
        `Conexão encerrada (Agent não registrado) — socketId: ${client.id}`,
      );
    }
  }


  // ─── Eventos recebidos do Agent ───────────────────────────────────────────────

  /**
   * O Agent deve emitir REGISTER_AGENT imediatamente após conectar,
   * informando seus dados de identificação.
   */
  @SubscribeMessage(PrinterEvent.REGISTER_AGENT)
  handleRegisterAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: RegisterAgentDto,
  ): void {
    const agent: PrinterAgent = {
      socketId:      client.id,
      deviceId:      dto.deviceId,
      storeId:       dto.storeId,
      hostname:      dto.hostname,
      version:       dto.version ?? 'unknown',
      connectedAt:   new Date(),
      lastHeartbeat: new Date(),
    };

    this.connectedAgents.set(client.id, agent);

    this.logger.log(
      `Agent registrado — deviceId: ${agent.deviceId} | storeId: ${agent.storeId} | hostname: ${agent.hostname} | version: ${agent.version}`,
    );
  }

  /**
   * Heartbeat periódico enviado pelo Agent.
   * Atualiza o timestamp de lastHeartbeat para monitoramento de saúde.
   */
  @SubscribeMessage(PrinterEvent.HEARTBEAT)
  handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceId: string },
  ): void {
    const agent = this.connectedAgents.get(client.id);

    if (!agent) {
      this.logger.warn(
        `Heartbeat recebido de Agent não registrado — socketId: ${client.id}`,
      );
      return;
    }

    agent.lastHeartbeat = new Date();

    this.logger.debug(
      `Heartbeat — deviceId: ${agent.deviceId} | storeId: ${agent.storeId}`,
    );
  }

  /**
   * Confirmação de impressão bem-sucedida enviada pelo Agent.
   */
  @SubscribeMessage(PrinterEvent.PRINT_SUCCESS)
  handlePrintSuccess(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: PrintResultDto,
  ): void {
    const agent = this.connectedAgents.get(client.id);

    this.logger.log(
      `✅ Impressão confirmada — jobId: ${dto.jobId} | deviceId: ${dto.deviceId} | agent: ${agent?.hostname ?? 'desconhecido'}`,
    );
  }

  /**
   * Reporte de falha na impressão enviado pelo Agent.
   */
  @SubscribeMessage(PrinterEvent.PRINT_ERROR)
  handlePrintError(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: PrintResultDto,
  ): void {
    const agent = this.connectedAgents.get(client.id);

    this.logger.error(
      `❌ Falha na impressão — jobId: ${dto.jobId} | deviceId: ${dto.deviceId} | agent: ${agent?.hostname ?? 'desconhecido'} | motivo: ${dto.message ?? 'não informado'}`,
    );
  }


  // ─── API pública para o PrinterService ───────────────────────────────────────

  /**
   * Envia um PrintJob para o primeiro Agent disponível da loja informada.
   *
   * Retorna true se ao menos um Agent recebeu o job, false caso contrário.
   * No futuro, implementar estratégias de seleção (round-robin, prioridade, etc.).
   */
  sendJobToStore(storeId: string, job: PrintJob): boolean {
    const agents = this.getAgentsByStore(storeId);

    if (agents.length === 0) {
      return false;
    }

    // Por ora envia ao primeiro Agent disponível da loja
    const target = agents[0];

    this.server
      .to(target.socketId)
      .emit(PrinterEvent.PRINT_ORDER, job);

    this.logger.log(
      `📤 PrintJob enviado — jobId: ${job.jobId} | storeId: ${storeId} | deviceId: ${target.deviceId}`,
    );

    return true;
  }

  /**
   * Retorna todos os agents registrados para uma loja específica.
   */
  getAgentsByStore(storeId: string): PrinterAgent[] {
    return Array.from(this.connectedAgents.values()).filter(
      (agent) => agent.storeId === storeId,
    );
  }

  /**
   * Retorna todos os agents atualmente conectados.
   * Útil para endpoints administrativos futuros.
   */
  getAllAgents(): PrinterAgent[] {
    return Array.from(this.connectedAgents.values());
  }
}
