/**
 * Representa um Print Agent conectado via WebSocket.
 *
 * Um Agent é um processo rodando na máquina local da loja,
 * responsável por receber pedidos do backend e acionar a impressora física.
 * O backend não conhece o tipo de impressora — apenas se comunica com o Agent.
 */
export interface PrinterAgent {
  /** ID único do socket desta conexão (gerenciado pelo Socket.IO) */
  socketId: string;

  /** Identificador único do dispositivo (gerado pelo próprio Agent) */
  deviceId: string;

  /** Identificador da loja à qual este Agent pertence */
  storeId: string;

  /** Nome do host da máquina onde o Agent está rodando */
  hostname: string;

  /** Versão do Print Agent (para compatibilidade futura) */
  version: string;

  /** Momento em que o Agent estabeleceu esta conexão */
  connectedAt: Date;

  /** Momento do último heartbeat recebido */
  lastHeartbeat: Date;
}
