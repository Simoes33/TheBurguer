import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface OrderStatusEvent {
  orderId: string;
  status: string;
  updatedAt: string;
}

@Injectable()
export class SseService {
  /**
   * Subject global que emite eventos de mudança de status de pedidos.
   * Qualquer subscriber (SSE connection) recebe o evento instantaneamente.
   */
  private readonly orderUpdates$ = new Subject<OrderStatusEvent>();

  /** Emite um novo evento para todos os clientes conectados via SSE */
  emitOrderStatusUpdate(event: OrderStatusEvent): void {
    this.orderUpdates$.next(event);
  }

  /** Observable que os controllers SSE assinam */
  getOrderUpdates$() {
    return this.orderUpdates$.asObservable();
  }
}
