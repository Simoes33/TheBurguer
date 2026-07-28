import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(private prisma: PrismaService) {}

  async process(dto: ChatbotMessageDto) {
    try {
      return await this.handleMessage(dto);
    } catch (err) {
      // Nunca deixa uma exceção crua virar 500 pro usuário final do chat.
      // O erro completo vai pro log do servidor pra investigação.
      this.logger.error(`Falha ao processar mensagem do chatbot: ${err.message}`, err.stack);
      return {
        reply: 'Desculpe, tive um problema técnico agora. Pode tentar de novo em instantes?'
      };
    }
  }

  private async handleMessage(dto: ChatbotMessageDto) {
    const message = dto.message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove acentos (á, ã, é, ó, etc.)

    // Normaliza userId: trata null (usuário não logado) e undefined da mesma forma,
    // evitando passar `null` explícito pro Prisma quando o campo não aceitar isso.
    const userId = dto.userId ?? undefined;

    // ─── BUSCA SESSÃO ────────────────────────────────────────
    let session = await this.prisma.chatSession.findFirst({
      where: { userId }
    });

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: { userId, state: 'START' }
      });
    }

    /*
      ==========================
      FLUXO PEDIDO
      ==========================
    */
    if (session.state === 'WAIT_ORDER') {
      const orderId = dto.message.replace('#', '').trim();

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } }
      });

      if (order) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: 'START' }
        });

        return {
          reply: `
📦 Pedido encontrado!

Status:
${order.status}

Total:
R$ ${order.total.toFixed(2)}

Itens:

${order.items.map(item => `${item.quantity}x ${item.product.name}`).join('\n')}
`
        };
      }

      return {
        reply: '❌ Não encontrei esse pedido. Verifique o código informado.'
      };
    }

    /*
      ==========================
      CARDÁPIO
      ==========================
    */
    if (message.includes('cardapio') || message.includes('menu')) {
      const products = await this.prisma.product.findMany({
        select: { name: true, price: true }
      });

      return {
        reply: `
🍔 Nosso cardápio:

${products.map(p => `${p.name} - R$ ${p.price.toFixed(2)}`).join('\n')}
`
      };
    }

    /*
      ==========================
      PEDIDO
      ==========================
    */
    if (message.includes('pedido')) {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: 'WAIT_ORDER' }
      });

      return {
        reply: '📦 Claro! Informe o código do seu pedido.'
      };
    }

    /*
      ==========================
      HORÁRIO
      ==========================
    */
    if (message.includes('horario')) {
      return {
        reply: '🕒 Funcionamos todos os dias das 18h às 23h.'
      };
    }

    return {
      reply: `
Olá! 🍔 Sou o assistente da The Burguer.

Posso ajudar com:

🍔 Cardápio
📦 Acompanhar pedido
🕒 Horários
`
    };
  }
}