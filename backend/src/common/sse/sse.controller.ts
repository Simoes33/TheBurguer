import { Controller, Get, Param, Sse, UseGuards, Req } from '@nestjs/common';
import { Observable, filter, map } from 'rxjs';
import { SseService } from './sse.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../users/dto/create-user.dto';
import { OrdersService } from '../../orders/orders.service';

@ApiTags('SSE — Real-time')
@Controller('sse')
export class SseController {
  constructor(
    private readonly sseService: SseService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Endpoint SSE para acompanhar um pedido específico em tempo real.
   * O frontend conecta aqui e recebe status updates instantaneamente
   * quando o admin altera o status do pedido.
   *
   * Formato de resposta: text/event-stream (padrão HTML5 EventSource)
   */
  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream SSE de atualizações de status de um pedido específico' })
  @Sse()
  async trackOrder(@Param('id') orderId: string, @Req() req: any): Promise<Observable<MessageEvent>> {
    // Valida a existência e ownership do pedido antes de abrir o stream
    await this.ordersService.findOne(orderId, req.user.id, req.user.role);

    return this.sseService.getOrderUpdates$().pipe(
      // Filtra: envia apenas eventos do pedido que o cliente está monitorando
      filter((event) => event.orderId === orderId),
      map((event) => ({
        data: JSON.stringify(event),
        type: 'order-update',
      } as MessageEvent)),
    );
  }

  /**
   * Endpoint SSE para o painel admin — recebe TODOS os eventos de pedidos.
   * Usado no AdminDashboard para mostrar novos pedidos e mudanças em tempo real.
   */
  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream SSE de todos os eventos de pedidos (admin)' })
  @Sse()
  adminOrders(): Observable<MessageEvent> {
    return this.sseService.getOrderUpdates$().pipe(
      map((event) => ({
        data: JSON.stringify(event),
        type: 'order-update',
      } as MessageEvent)),
    );
  }
}
