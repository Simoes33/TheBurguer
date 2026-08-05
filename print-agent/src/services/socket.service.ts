import { io, Socket } from 'socket.io-client';
import { printerService } from './printer.service';
import { getOrCreateDeviceId } from '../utils/uuid';
import { Platform } from 'react-native';

export enum PrinterEvent {
  REGISTER_AGENT = 'register_agent',
  HEARTBEAT = 'heartbeat',
  PRINT_ORDER = 'print_order',
  PRINT_SUCCESS = 'print_success',
  PRINT_ERROR = 'print_error',
}

export interface SocketServiceOptions {
  backendUrl: string;
  storeId: string;
  onStatusChange?: (connected: boolean, message?: string) => void;
  onJobReceived?: (jobId: string, orderId: string) => void;
}

export class SocketService {
  private socket: Socket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private deviceId: string = '';
  private options: SocketServiceOptions | null = null;

  async init(options: SocketServiceOptions) {
    this.options = options;
    this.deviceId = await getOrCreateDeviceId();
    this.connect();
  }

  connect() {
    if (!this.options) return;

    if (this.socket) {
      this.socket.disconnect();
    }

    const { backendUrl, storeId, onStatusChange, onJobReceived } = this.options;

    // Conecta ao namespace /printer do backend NestJS
    const url = backendUrl.endsWith('/') ? `${backendUrl}printer` : `${backendUrl}/printer`;

    console.log(`[SocketService] Conectando ao backend: ${url}`);
    if (onStatusChange) onStatusChange(false, 'Conectando ao backend...');

    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Conectado ao servidor WebSocket!');
      if (onStatusChange) onStatusChange(true, 'Conectado ao backend');

      // Registrar o Agent no backend
      this.socket?.emit(PrinterEvent.REGISTER_AGENT, {
        deviceId: this.deviceId,
        storeId: storeId || 'default',
        hostname: 'Android-PrintAgent',
        version: '1.0.0',
      });

      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[SocketService] Desconectado:', reason);
      if (onStatusChange) onStatusChange(false, `Desconectado (${reason})`);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Erro de conexão:', error.message);
      if (onStatusChange) onStatusChange(false, `Erro de conexão: ${error.message}`);
    });

    // Escutar comandos de impressão
    this.socket.on(PrinterEvent.PRINT_ORDER, async (job: any) => {
      console.log('[SocketService] Pedido recebido para impressão:', job);
      const { jobId, orderId, payload } = job;

      if (onJobReceived) onJobReceived(jobId, orderId);

      try {
        await printerService.printOrder(payload || job);

        this.socket?.emit(PrinterEvent.PRINT_SUCCESS, {
          jobId,
          deviceId: this.deviceId,
          message: 'Impressão concluída com sucesso via Bluetooth',
        });
      } catch (err: any) {
        console.error('[SocketService] Erro ao imprimir pedido:', err);

        this.socket?.emit(PrinterEvent.PRINT_ERROR, {
          jobId,
          deviceId: this.deviceId,
          message: err?.message || 'Falha ao transmitir bytes para impressora Bluetooth',
        });
      }
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit(PrinterEvent.HEARTBEAT, {
          deviceId: this.deviceId,
        });
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
