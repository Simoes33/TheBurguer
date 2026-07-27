import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { SseService } from '../common/sse/sse.service';

@Injectable()
export class PushService implements OnModuleInit {

  private readonly logger = new Logger(PushService.name);

  constructor(
    private prisma: PrismaService,
    private sseService: SseService,
  ) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  }

  onModuleInit() {
    // Ouve os mesmos eventos que já disparam o SSE
    this.sseService.getOrderUpdates$().subscribe(async (event) => {
      await this.notifyOrderStatusChange(event.orderId, event.status);
    });
  }

  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY;
  }

  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  async unsubscribe(endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  private async notifyOrderStatusChange(orderId: string, status: string) {

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: order.userId },
    });

    const statusLabels: Record<string, string> = {
      PENDING: 'Recebido! Já estamos preparando 🍔',
      PREPARING: 'Seu pedido está na brasa 🔥',
      READY: 'Pedido pronto! ✅',
      OUT_FOR_DELIVERY: 'Saiu para entrega 🛵',
      DELIVERED: 'Pedido entregue! Bom apetite 🎉',
      CANCELLED: 'Pedido cancelado',
    };

    const payload = JSON.stringify({
      title: 'The Burguer',
      body: statusLabels[status] || `Status atualizado: ${status}`,
      orderId,
      url: `/tracking/${orderId}`,
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (error: any) {
        this.logger.warn(`Push falhou para ${sub.endpoint}: ${error.message}`);

        // Inscrição expirada/inválida — remove do banco
        if (error.statusCode === 404 || error.statusCode === 410) {
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  }
}