import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';

const MAX_ORDER_ATTEMPTS = 3;
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

const EXIT_KEYWORDS = ['cancelar', 'sair', 'voltar', 'menu', 'reiniciar', 'inicio', 'início'];

const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: '⏳ Pendente / Recebido',
  PREPARING: '👨‍🍳 Em preparo na chapa',
  READY: '✅ Pronto para retirada/entrega',
  OUT_FOR_DELIVERY: '🛵 Saiu para entrega',
  DELIVERED: '🎉 Pedido Entregue',
  CANCELLED: '❌ Cancelado',
};

const MENU_TEXT = `
Olá! 🍔 Sou o assistente da The Burguer.

Posso ajudar com:
• 🍔 Digite *cardápio* para ver nossos produtos
• 📦 Digite *pedido* para rastrear seu pedido
• 🕒 Digite *horário* para saber o horário de funcionamento
`;

@Injectable()
export class ChatbotService {
  constructor(private prisma: PrismaService) {}

  async process(userId: string | undefined, dto: ChatbotMessageDto) {
    const rawMessage = dto.message || '';
    const message = rawMessage
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove acentos

    // ─── BUSCA OU CRIA SESSÃO (Suporta visitantes anônimos e usuários logados) ───
    let session = null;

    if (userId) {
      session = await this.prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (dto.sessionId) {
      session = await this.prisma.chatSession.findUnique({
        where: { id: dto.sessionId },
      }).catch(() => null);
    }

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: {
          id: dto.sessionId || undefined,
          userId: userId || null,
          state: 'START',
        },
      });
    }

    // Reset por inatividade — se ficou parado no meio do fluxo de pedido
    if (session.state === 'WAIT_ORDER') {
      const idleTime = Date.now() - new Date(session.updatedAt).getTime();
      if (idleTime > INACTIVITY_LIMIT_MS) {
        session = await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: 'START', attempts: 0 },
        });
      }
    }

    // Palavras de saída — funcionam em qualquer estado
    const isExitRequest = EXIT_KEYWORDS.some((keyword) => message.includes(keyword));
    if (isExitRequest && session.state !== 'START') {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: 'START', attempts: 0 },
      });

      return {
        sessionId: session.id,
        reply: `Sem problemas, voltando ao menu principal! 👍\n${MENU_TEXT}`,
      };
    }

    // Identifica se a intenção mudou enquanto esperava código
    const looksLikeOtherIntent =
      message.includes('cardapio') ||
      message.includes('menu') ||
      message.includes('horario') ||
      message.includes('horas') ||
      message.includes('funciona');

    if (session.state === 'WAIT_ORDER' && looksLikeOtherIntent) {
      session = await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: 'START', attempts: 0 },
      });
    }

    /*
    ==========================
    FLUXO: RASTREIO DE PEDIDO
    ==========================
    */
    if (session.state === 'WAIT_ORDER') {
      const orderId = rawMessage.replace('#', '').trim();

      const whereCondition = userId
        ? { id: orderId, userId }
        : { id: orderId };

      let order = null;
      try {
        order = await this.prisma.order.findFirst({
          where: whereCondition,
          include: {
            items: { include: { product: true } },
          },
        });
      } catch {
        order = null;
      }

      if (order) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: 'START', attempts: 0 },
        });

        const statusDescription = ORDER_STATUS_MAP[order.status] || order.status;
        const itemsList = order.items
          .map((item) => `• ${item.quantity}x ${item.product?.name || 'Item'}`)
          .join('\n');

        return {
          sessionId: session.id,
          reply: `📦 **Pedido #${order.id.slice(0, 8)}**\n\n` +
            `**Status:** ${statusDescription}\n` +
            `**Total:** R$ ${order.total.toFixed(2).replace('.', ',')}\n\n` +
            `**Itens:**\n${itemsList}\n\n` +
            `Mais alguma dúvida?`,
        };
      }

      const attempts = (session.attempts || 0) + 1;

      if (attempts >= MAX_ORDER_ATTEMPTS) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: 'START', attempts: 0 },
        });

        return {
          sessionId: session.id,
          reply: `Não consegui localizar esse pedido depois de algumas tentativas. Voltando ao menu inicial! 🙂\n${MENU_TEXT}`,
        };
      }

      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { attempts },
      });

      return {
        sessionId: session.id,
        reply: `❌ Não encontrei nenhum pedido com esse código. Verifique o código (ex: id do pedido) ou digite "cancelar" para voltar. (Tentativa ${attempts}/${MAX_ORDER_ATTEMPTS})`,
      };
    }

    /*
    ==========================
    CARDÁPIO
    ==========================
    */
    if (message.includes('cardapio') || message.includes('menu') || message.includes('lanche') || message.includes('burg')) {
      const products = await this.prisma.product.findMany({
        where: { stock: { gt: 0 } },
        select: { name: true, price: true, category: { select: { name: true } } },
        orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
      });

      if (!products.length) {
        return {
          sessionId: session.id,
          reply: '🍔 Nosso cardápio está sendo atualizado no momento. Você pode conferir os itens na página inicial!',
        };
      }

      const formattedMenu = products
        .map((p) => `• **${p.name}** — R$ ${p.price.toFixed(2).replace('.', ',')}`)
        .join('\n');

      return {
        sessionId: session.id,
        reply: `🍔 **Nosso Cardápio Especial:**\n\n${formattedMenu}\n\n💡 Você pode clicar nos produtos na tela para adicionar ao carrinho!`,
      };
    }

    /*
    ==========================
    PEDIDO
    ==========================
    */
    if (message.includes('pedido') || message.includes('rastrear') || message.includes('entrega') || message.includes('status')) {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: 'WAIT_ORDER', attempts: 0 },
      });

      return {
        sessionId: session.id,
        reply: '📦 Por favor, digite o **código do seu pedido** (você encontra na tela Meus Pedidos ou no comprovante). Digite "cancelar" para voltar a qualquer momento.',
      };
    }

    /*
    ==========================
    HORÁRIO
    ==========================
    */
    if (message.includes('horario') || message.includes('horas') || message.includes('funciona') || message.includes('aberto') || message.includes('abre')) {
      return {
        sessionId: session.id,
        reply: '🕒 **Horário de Funcionamento:**\n\nTerça a Domingo: das **19:00 às 23:00**.\nSegunda-feira: Fechado para descanso da equipe.',
      };
    }

    /*
    ==========================
    SAUDAÇÕES / MENU PADRÃO
    ==========================
    */
    return {
      sessionId: session.id,
      reply: MENU_TEXT,
    };
  }
}