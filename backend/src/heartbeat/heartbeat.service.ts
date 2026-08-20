import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HeartbeatService implements OnModuleInit {
  private readonly logger = new Logger(HeartbeatService.name);
  private consecutiveFailures = 0;
  private readonly MAX_FAILURES = 5;
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa um SELECT 1 leve a cada 4 minutos para manter a conexão
   * com o Supabase (free tier) ativa e evitar que o pooler encerre
   * as conexões inativas.
   */
  @Cron('0 */4 * * * *') // a cada 4 minutos
  async keepAlive(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      if (this.consecutiveFailures > 0) {
        this.logger.log(
          `✅ Heartbeat restaurado após ${this.consecutiveFailures} falha(s) consecutiva(s).`,
        );
      } else {
        this.logger.debug('💓 Heartbeat Supabase OK — conexão ativa.');
      }

      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures++;

      this.logger.error(
        `❌ Heartbeat falhou (${this.consecutiveFailures}/${this.MAX_FAILURES}): ${(error as Error).message}`,
      );

      if (this.consecutiveFailures >= this.MAX_FAILURES) {
        this.logger.error(
          `🚨 ${this.MAX_FAILURES} falhas consecutivas no heartbeat. ` +
            'Verifique a conectividade com o Supabase.',
        );
      }

      // Tenta reconectar explicitamente após falha
      try {
        await this.prisma.$disconnect();
        await this.prisma.$connect();
        this.logger.warn('🔄 Reconexão com Supabase tentada após heartbeat falhar.');
      } catch (reconnectError) {
        this.logger.error(
          `Reconexão falhou: ${(reconnectError as Error).message}`,
        );
      }
    }
  }

  /**
   * Verifica a saúde da aplicação e do banco de dados em tempo real.
   * Usado pelas rotas públicas /health e /heartbeat/ping.
   */
  async checkHealth(): Promise<{
    status: 'ok' | 'degraded' | 'error';
    database: 'connected' | 'disconnected';
    latencyMs: number;
    uptimeSeconds: number;
    consecutiveFailures: number;
    timestamp: string;
  }> {
    const start = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      this.consecutiveFailures = 0;
    } catch (err) {
      this.consecutiveFailures++;
      dbStatus = 'disconnected';
      overallStatus = this.consecutiveFailures >= this.MAX_FAILURES ? 'error' : 'degraded';
      this.logger.error(`Health check DB query failed: ${(err as Error).message}`);
    }

    const latencyMs = Date.now() - start;
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: overallStatus,
      database: dbStatus,
      latencyMs,
      uptimeSeconds,
      consecutiveFailures: this.consecutiveFailures,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Roda uma vez na inicialização para confirmar que o banco está acessível
   * logo após o servidor subir.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('🚀 HeartbeatService inicializado — verificando Supabase...');
    await this.keepAlive();
  }
}
