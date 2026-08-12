import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(PaymentsService.name);

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      this.logger.warn('STRIPE_SECRET_KEY não foi definida nas variáveis de ambiente!');
    }
    this.stripe = new Stripe(key || 'invalid_key', {
      apiVersion: '2025-01-27-acacia' as any,
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'brl', orderId?: string) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Valor do pagamento inválido.');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency,
        automatic_payment_methods: { enabled: true },
        // Metadado para rastrear o pedido no webhook
        metadata: {
          orderId: orderId ?? '',
          source: 'TheBurguer',
        },
      });

      this.logger.log(`PaymentIntent criado: ${paymentIntent.id} — R$ ${amount.toFixed(2)}`);
      return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
    } catch (error) {
      this.logger.error(`Erro Stripe PaymentIntent: ${error.message}`);
      throw error;
    }
  }

  async createSetupIntent(customerId?: string) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });
      return { clientSecret: setupIntent.client_secret };
    } catch (error) {
      this.logger.error(`Erro Stripe SetupIntent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida e processa o evento recebido pelo webhook do Stripe.
   * Retorna o tipo de evento e os dados relevantes para o controller.
   */
  constructWebhookEvent(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET não configurado. Rejeitando validação de webhook.');
      throw new BadRequestException('Configuração de webhook incompleta no servidor.');
    }

    if (!signature) {
      throw new BadRequestException('Assinatura do Stripe ausente nos cabeçalhos.');
    }

    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Assinatura do webhook inválida: ${err.message}`);
      throw new BadRequestException(`Webhook inválido: ${err.message}`);
    }
  }
}
