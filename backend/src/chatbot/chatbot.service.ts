import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';

const MAX_ORDER_ATTEMPTS = 3;
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

const EXIT_KEYWORDS = ['cancelar', 'sair', 'voltar', 'menu', 'reiniciar', 'inicio', 'início'];

const MENU_TEXT = `
Olá! 🍔 Sou o assistente da The Burguer.

Posso ajudar com:

🍔 Cardápio
📦 Acompanhar pedido
🕒 Horários
`;

@Injectable()
export class ChatbotService {

  constructor(private prisma: PrismaService) {}

  async process(dto: ChatbotMessageDto) {

    const message = dto.message
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove acentos

    // BUSCA SESSÃO

    let session = await this.prisma.chatSession.findFirst({
      where: { userId: dto.userId }
    });

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: { userId: dto.userId, state: "START" }
      });
    }

    // Reset por inatividade — se ficou parado no meio do fluxo de pedido
    if (session.state === "WAIT_ORDER") {
      const idleTime = Date.now() - new Date(session.updatedAt).getTime();

      if (idleTime > INACTIVITY_LIMIT_MS) {
        session = await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: "START", attempts: 0 }
        });
      }
    }

    // Palavras de saída — funcionam em QUALQUER estado, a qualquer momento
    const isExitRequest = EXIT_KEYWORDS.some(keyword => message.includes(keyword));

    if (isExitRequest && session.state !== "START") {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: "START", attempts: 0 }
      });

      return {
        reply: `Sem problemas, voltando ao menu principal! 👍\n${MENU_TEXT}`
      };
    }

    // Se está esperando um código de pedido, mas a mensagem parece ser
    // outra intenção (cardápio/horário/pedido novo), sai do fluxo sozinho
    // em vez de travar tentando interpretar como código.
    const looksLikeOtherIntent =
      message.includes("cardapio") ||
      message.includes("menu") ||
      message.includes("horario") ||
      message.includes("pedido");

    if (session.state === "WAIT_ORDER" && looksLikeOtherIntent) {
      session = await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: "START", attempts: 0 }
      });
      // segue o fluxo normal abaixo, já com o estado resetado
    }

    /*
    ==========================
    FLUXO PEDIDO
    ==========================
    */

    if (session.state === "WAIT_ORDER") {

      const orderId = dto.message.replace('#', '').trim();

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } }
        }
      });

      if (order) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: "START", attempts: 0 }
        });

        return {
          reply: `
📦 Pedido encontrado!

Status:
${order.status}

Total:
R$ ${order.total.toFixed(2)}

Itens:

${order.items.map(item => `${item.quantity}x ${item.product.name}`).join("\n")}
`
        };
      }

      const attempts = session.attempts + 1;

      if (attempts >= MAX_ORDER_ATTEMPTS) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: "START", attempts: 0 }
        });

        return {
          reply: `Não consegui localizar esse pedido depois de algumas tentativas. Vamos voltar ao menu principal — pode tentar de novo quando quiser! 🙂\n${MENU_TEXT}`
        };
      }

      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { attempts }
      });

      return {
        reply: `❌ Não encontrei esse pedido. Verifique o código, ou digite "cancelar" para voltar ao menu. (Tentativa ${attempts}/${MAX_ORDER_ATTEMPTS})`
      };
    }

    /*
    ==========================
    CARDÁPIO
    ==========================
    */

    if (message.includes("cardapio") || message.includes("menu")) {

      const products = await this.prisma.product.findMany({
        select: { name: true, price: true }
      });

      return {
        reply: `
🍔 Nosso cardápio:

${products.map(p => `${p.name} - R$ ${p.price.toFixed(2)}`).join("\n")}
`
      };
    }

    /*
    ==========================
    PEDIDO
    ==========================
    */

    if (message.includes("pedido")) {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: "WAIT_ORDER", attempts: 0 }
      });

      return {
        reply: "📦 Claro! Informe o código do seu pedido. (Ou digite \"cancelar\" a qualquer momento para voltar ao menu.)"
      };
    }

    /*
    ==========================
    HORÁRIO
    ==========================
    */

    if (message.includes("horario")) {
      return {
        reply: "🕒 Funcionamos de Terça a Domingo, das 19h às 23h."
      };
    }

    return {
      reply: MENU_TEXT
    };
  }
}