import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  RawBodyRequest,
  Req,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { BadRequestException } from '@nestjs/common';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um PaymentIntent no Stripe para processar pagamento' })
  async createIntent(
    @Req() req: any,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    // Garante que o pedido existe e pertence ao usuário autenticado (ou admin)
    const order = await this.ordersService.findOne(dto.orderId, req.user.id, req.user.role);
    const currency = dto.currency || 'brl';
    return this.paymentsService.createPaymentIntent(order.total, currency, order.id);
  }

  @Post('setup-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um SetupIntent para salvar método de pagamento' })
  async setupIntent(@Body('customerId') customerId?: string) {
    return this.paymentsService.createSetupIntent(customerId);
  }

  /**
   * Webhook assíncrono do Stripe.
   * NÃO usa JwtAuthGuard — autenticado via assinatura HMAC do Stripe.
   * Deve receber o raw body (Buffer) para validar a assinatura.
   */
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Endpoint de webhook assíncrono do Stripe (sem JWT)' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      this.logger.warn('Webhook recebido sem rawBody.');
      throw new BadRequestException('Raw body ausente na requisição do webhook.');
    }

    let event: any;
    try {
      event = this.paymentsService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      this.logger.error(`Falha ao validar webhook: ${err.message}`);
      throw new BadRequestException(`Falha ao validar webhook: ${err.message}`);
    }

    this.logger.log(`Webhook Stripe recebido: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const orderId = intent.metadata?.orderId;

        if (orderId) {
          this.logger.log(`Pagamento confirmado para pedido: ${orderId}`);
          // Avança o status do pedido de PENDING para PREPARING ao confirmar pagamento
          try {
            await this.ordersService.updateStatus(orderId, 'PREPARING' as any);
            this.logger.log(`Pedido ${orderId} movido para PREPARING após pagamento confirmado.`);
          } catch (err) {
            this.logger.error(`Erro ao atualizar pedido ${orderId}: ${err.message}`);
          }
        } else {
          this.logger.warn(`payment_intent.succeeded sem orderId no metadata: ${intent.id}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        const orderId = intent.metadata?.orderId;
        const failureMessage = intent.last_payment_error?.message ?? 'Motivo desconhecido';

        this.logger.warn(
          `Pagamento falhou${orderId ? ` para pedido ${orderId}` : ''}: ${failureMessage}`,
        );

        // Cancela o pedido automaticamente se o pagamento falhar
        if (orderId) {
          try {
            await this.ordersService.updateStatus(orderId, 'CANCELLED' as any);
            this.logger.log(`Pedido ${orderId} cancelado após falha no pagamento.`);
          } catch (err) {
            this.logger.error(`Erro ao cancelar pedido ${orderId}: ${err.message}`);
          }
        }
        break;
      }

      case 'charge.refunded': {
        this.logger.log(`Reembolso processado: ${event.data.object.id}`);
        // Ponto de extensão: notificar cliente, atualizar registros financeiros, etc.
        break;
      }

      default:
        this.logger.log(`Evento Stripe não tratado (ignorado): ${event.type}`);
    }

    // Sempre retorna 200 para o Stripe não retentar o evento
    return { received: true };
  }
}
