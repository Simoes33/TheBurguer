import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { AiService } from './ai.service';

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

export interface ChatbotResponse {
  sessionId: string;
  reply: string;
  type?: 'text' | 'products' | 'menu_highlights' | 'order' | 'cart_prompt' | 'whatsapp';
  data?: any;
  quickReplies?: string[];
  storeStatus?: {
    isOpen: boolean;
    label: string;
  };
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Consulta o status de abertura da loja em tempo real
   */
  async getStoreStatus(): Promise<{ isOpen: boolean; label: string }> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: 'isOpen' },
      });
      const isOpen = setting ? setting.value === 'true' : true;
      return {
        isOpen,
        label: isOpen ? '🟢 Aberto agora' : '🔴 Fechado no momento',
      };
    } catch {
      return { isOpen: true, label: '🟢 Aberto agora' };
    }
  }

  /**
   * Reinicia a sessão do chatbot
   */
  async reset(sessionId?: string) {
    if (sessionId) {
      try {
        await this.prisma.chatSession.deleteMany({
          where: { id: sessionId },
        });
      } catch (e) {
        this.logger.warn(`Erro ao deletar sessão de chat ${sessionId}: ${e}`);
      }
    }
    return { success: true, message: 'Sessão reiniciada com sucesso.' };
  }

  /**
   * Processamento principal da mensagem do chatbot
   */
  async process(userId: string | undefined, dto: ChatbotMessageDto): Promise<ChatbotResponse> {
    const rawMessage = (dto.message || '').trim();
    const message = rawMessage
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove acentos

    const storeStatus = await this.getStoreStatus();

    // ─── 1. BUSCA OU CRIA SESSÃO ──────────────────────────────────
    let session = null;
    if (dto.sessionId) {
      session = await this.prisma.chatSession.findUnique({
        where: { id: dto.sessionId },
      }).catch(() => null);
    }

    if (!session && userId) {
      session = await this.prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
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

    // Salva a mensagem do usuário no banco (assíncrono para velocidade)
    this.saveMessage(session.id, 'user', rawMessage);

    // Reset por inatividade no meio do fluxo de pedido
    if (session.state === 'WAIT_ORDER') {
      const idleTime = Date.now() - new Date(session.updatedAt).getTime();
      if (idleTime > INACTIVITY_LIMIT_MS) {
        session = await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: 'START', attempts: 0 },
        });
      }
    }

    // Palavras de cancelamento / retorno
    const isExitRequest = EXIT_KEYWORDS.some((kw) => message === kw || message.startsWith(kw));
    if (isExitRequest && session.state !== 'START') {
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: 'START', attempts: 0 },
      });

      return this.sendResponse(session.id, {
        reply: 'Sem problemas! Voltamos ao início. Como posso te ajudar agora? 🍔',
        quickReplies: ['🍔 Ver Cardápio', '📦 Rastrear Pedido', '🛒 Meu Carrinho', '🕒 Horário de Funcionamento'],
        storeStatus,
      });
    }

    // ─── 2. FLUXO: RASTREIO DE PEDIDO DIGITADO ────────────────────
    if (session.state === 'WAIT_ORDER') {
      const cleanOrderId = rawMessage.replace('#', '').trim();

      const order = await this.prisma.order.findFirst({
        where: {
          OR: [
            { id: cleanOrderId },
            { id: { startsWith: cleanOrderId } },
          ],
        },
        include: {
          items: { include: { product: true } },
        },
      }).catch(() => null);

      if (order) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: 'START', attempts: 0 },
        });

        const statusDescription = ORDER_STATUS_MAP[order.status] || order.status;
        const itemsList = order.items
          .map((i) => `• ${i.quantity}x ${i.product?.name || 'Item'}`)
          .join('\n');

        return this.sendResponse(session.id, {
          type: 'order',
          reply: `📦 **Pedido #${order.id.slice(0, 8)}** localizado com sucesso!\n\n` +
            `**Status:** ${statusDescription}\n` +
            `**Total:** R$ ${order.total.toFixed(2).replace('.', ',')}\n\n` +
            `**Itens:**\n${itemsList}`,
          data: { order },
          quickReplies: ['Acompanhar Pedido ao Vivo', '🍔 Ver Cardápio', '💬 Falar no WhatsApp'],
          storeStatus,
        });
      }

      const attempts = (session.attempts || 0) + 1;
      if (attempts >= MAX_ORDER_ATTEMPTS) {
        await this.prisma.chatSession.update({
          where: { id: session.id },
          data: { state: 'START', attempts: 0 },
        });

        return this.sendResponse(session.id, {
          reply: 'Não consegui localizar seu pedido após algumas tentativas. Você pode checar na aba **"Meus Pedidos"** ou chamar nosso time no WhatsApp! 👍',
          quickReplies: ['🍔 Ver Cardápio', '💬 Falar no WhatsApp', '🛒 Meu Carrinho'],
          storeStatus,
        });
      }

      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { attempts },
      });

      return this.sendResponse(session.id, {
        reply: `❌ Não encontrei nenhum pedido com esse código. Verifique se digitou corretamente ou envie "cancelar" para voltar. (Tentativa ${attempts}/${MAX_ORDER_ATTEMPTS})`,
        quickReplies: ['cancelar', '💬 Falar com Atendente'],
        storeStatus,
      });
    }

    // ─── 3. INTENÇÃO: RASTREAMENTO INTELIGENTE DE PEDIDOS ─────────
    const isOrderIntent =
      message.includes('pedido') ||
      message.includes('rastrear') ||
      message.includes('status') ||
      message.includes('onde esta') ||
      message.includes('cade meu') ||
      message.includes('minha entrega') ||
      message.includes('chegando');

    if (isOrderIntent) {
      // Se o usuário estiver logado, busca automaticamente os pedidos mais recentes dele!
      if (userId) {
        const userOrders = await this.prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 2,
          include: {
            items: { include: { product: true } },
          },
        }).catch(() => []);

        if (userOrders.length > 0) {
          const activeOrder = userOrders.find((o) =>
            ['PENDING', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status),
          );

          if (activeOrder) {
            const statusDesc = ORDER_STATUS_MAP[activeOrder.status] || activeOrder.status;
            const itemsList = activeOrder.items
              .map((i) => `• ${i.quantity}x ${i.product?.name || 'Item'}`)
              .join('\n');

            return this.sendResponse(session.id, {
              type: 'order',
              reply: `Encontrei seu pedido em andamento! 🛵\n\n` +
                `**Pedido #${activeOrder.id.slice(0, 8)}**\n` +
                `**Status:** ${statusDesc}\n` +
                `**Total:** R$ ${activeOrder.total.toFixed(2).replace('.', ',')}\n\n` +
                `**Itens:**\n${itemsList}\n\n` +
                `Você pode clicar no botão abaixo para acompanhar cada etapa em tempo real:`,
              data: { order: activeOrder },
              quickReplies: ['Acompanhar Pedido ao Vivo', '🍔 Ver Cardápio', '💬 Falar no WhatsApp'],
              storeStatus,
            });
          }

          // Se não há pedido ativo, mostra o último concluído
          const lastOrder = userOrders[0];
          const statusDesc = ORDER_STATUS_MAP[lastOrder.status] || lastOrder.status;
          return this.sendResponse(session.id, {
            type: 'order',
            reply: `Seu último pedido foi o **#${lastOrder.id.slice(0, 8)}** (${statusDesc}).\n\n` +
              `Total: R$ ${lastOrder.total.toFixed(2).replace('.', ',')}.\n` +
              `Deseja fazer um novo pedido hoje? 🍔🔥`,
            data: { order: lastOrder },
            quickReplies: ['🍔 Ver Cardápio', '🔥 Mais Vendidos', '🛒 Meu Carrinho'],
            storeStatus,
          });
        }
      }

      // Se for visitante anônimo ou usuário sem pedidos
      await this.prisma.chatSession.update({
        where: { id: session.id },
        data: { state: 'WAIT_ORDER', attempts: 0 },
      });

      return this.sendResponse(session.id, {
        reply: '📦 Por favor, digite o **código do seu pedido** (ex: os 8 primeiros caracteres ou o código completo do comprovante). Digite "cancelar" a qualquer momento para voltar.',
        quickReplies: ['cancelar'],
        storeStatus,
      });
    }

    // ─── 4. INTENÇÃO: CONSULTA DE CARRINHO ─────────────────────────
    if (
      message.includes('carrinho') ||
      message.includes('sacola') ||
      message.includes('quanto deu') ||
      message.includes('fechar pedido') ||
      message.includes('finalizar pedido')
    ) {
      return this.sendResponse(session.id, {
        type: 'cart_prompt',
        reply: '🛒 Você pode visualizar todos os itens do seu pedido, ajustar quantidades e finalizar a compra abrindo seu carrinho:',
        quickReplies: ['Abrir Carrinho', '🍔 Ver Cardápio', '💳 Formas de Pagamento'],
        storeStatus,
      });
    }

    // ─── 5. INTENÇÃO: HORÁRIO & STATUS DA LOJA ────────────────────
    if (
      message.includes('horario') ||
      message.includes('horas') ||
      message.includes('funciona') ||
      message.includes('aberto') ||
      message.includes('fechado') ||
      message.includes('abre') ||
      message.includes('expediente')
    ) {
      const openMessage = storeStatus.isOpen
        ? '🟢 **Estamos ABERTOS agora!** A chapa está quente e pronta para preparar seu burger.'
        : '🔴 **Estamos FECHADOS no momento.** Mas você já pode navegar pelo cardápio e montar seu carrinho!';

      return this.sendResponse(session.id, {
        reply: `${openMessage}\n\n` +
          `🕒 **Horário de Atendimento:**\n` +
          `• **Terça a Domingo:** das 19:00 às 23:00\n` +
          `• **Segunda-feira:** Fechado para descanso da equipe\n\n` +
          `Qualquer dúvida, estamos por aqui!`,
        quickReplies: ['🍔 Ver Cardápio', '🛵 Tempo de Entrega', '💳 Formas de Pagamento'],
        storeStatus,
      });
    }

    // ─── 6. INTENÇÃO: FORMAS DE PAGAMENTO ─────────────────────────
    if (
      message.includes('pagamento') ||
      message.includes('pagar') ||
      message.includes('cartao') ||
      message.includes('pix') ||
      message.includes('dinheiro') ||
      message.includes('troco') ||
      message.includes('aceita')
    ) {
      return this.sendResponse(session.id, {
        reply: '💳 **Formas de Pagamento Aceitas:**\n\n' +
          '• **PIX:** Aprovação imediata e segura com QR Code e Chave Copia-e-Cola.\n' +
          '• **Cartão de Crédito / Débito:** Pelo site/app (Stripe) ou na maquininha na entrega.\n' +
          '• **Dinheiro:** Você pode informar o valor para troco ao finalizar o pedido.\n\n' +
          'Tudo com total segurança e praticidade!',
        quickReplies: ['🍔 Ver Cardápio', '🛵 Taxa de Entrega', '🛒 Meu Carrinho'],
        storeStatus,
      });
    }

    // ─── 7. INTENÇÃO: ENTREGA / FRETE / PRAZOS ───────────────────
    if (
      message.includes('entrega') ||
      message.includes('frete') ||
      message.includes('taxa') ||
      message.includes('tempo') ||
      message.includes('demora') ||
      message.includes('prazo') ||
      message.includes('retirada') ||
      message.includes('onde entrega')
    ) {
      return this.sendResponse(session.id, {
        reply: '🛵 **Informações de Entrega:**\n\n' +
          '• **Tempo Médio:** 35 a 50 minutos a partir da confirmação.\n' +
          '• **Taxa de Entrega:** Calculada automaticamente ao inserir o seu CEP/Endereço no checkout.\n' +
          '• **Retirada no Balcão:** Disponível gratuitamente! Você escolhe ao finalizar seu pedido.\n\n' +
          'Quer conferir as delícias de hoje?',
        quickReplies: ['🍔 Ver Cardápio', '🔥 Mais Vendidos', '🕒 Horário de Funcionamento'],
        storeStatus,
      });
    }

    // ─── 8. INTENÇÃO: ATENDENTE HUMANO / WHATSAPP ─────────────────
    if (
      message.includes('whatsapp') ||
      message.includes('humano') ||
      message.includes('atendente') ||
      message.includes('pessoa') ||
      message.includes('suporte') ||
      message.includes('telefone') ||
      message.includes('falar') ||
      message.includes('contato')
    ) {
      return this.sendResponse(session.id, {
        type: 'whatsapp',
        reply: 'Precisa falar com nossa equipe humana? Nosso time está à disposição para te atender diretamente no WhatsApp!',
        quickReplies: ['Falar no WhatsApp', '🍔 Ver Cardápio', '📦 Rastrear Pedido'],
        storeStatus,
      });
    }

    // ─── 9. INTENÇÃO: CARDÁPIO & BUSCA DE PRODUTOS ────────────────
    const isMenuOrProductSearch =
      message.includes('cardapio') ||
      message.includes('menu') ||
      message.includes('lanche') ||
      message.includes('burg') ||
      message.includes('artesanal') ||
      message.includes('smash') ||
      message.includes('bacon') ||
      message.includes('cheddar') ||
      message.includes('frango') ||
      message.includes('bebida') ||
      message.includes('refrigerante') ||
      message.includes('batata') ||
      message.includes('fritas') ||
      message.includes('sobremesa') ||
      message.includes('doce') ||
      message.includes('mais vendido') ||
      message.includes('recomenda') ||
      message.includes('especiais');

    if (isMenuOrProductSearch) {
      // Determina filtro baseado nos termos do usuário
      let whereClause: any = { stock: { gt: 0 } };

      if (message.includes('bebida') || message.includes('refrigerante') || message.includes('coca') || message.includes('suco')) {
        whereClause.category = { name: { contains: 'Bebida', mode: 'insensitive' } };
      } else if (message.includes('batata') || message.includes('fritas') || message.includes('porcao') || message.includes('acompanha')) {
        whereClause.category = { name: { contains: 'Acompanha', mode: 'insensitive' } };
      } else if (message.includes('sobremesa') || message.includes('doce')) {
        whereClause.category = { name: { contains: 'Sobremesa', mode: 'insensitive' } };
      } else if (message.includes('bacon')) {
        whereClause.OR = [
          { name: { contains: 'Bacon', mode: 'insensitive' } },
          { description: { contains: 'bacon', mode: 'insensitive' } },
          { ingredients: { contains: 'bacon', mode: 'insensitive' } },
        ];
      } else if (message.includes('cheddar')) {
        whereClause.OR = [
          { name: { contains: 'Cheddar', mode: 'insensitive' } },
          { description: { contains: 'cheddar', mode: 'insensitive' } },
          { ingredients: { contains: 'cheddar', mode: 'insensitive' } },
        ];
      } else if (message.includes('frango')) {
        whereClause.OR = [
          { name: { contains: 'Frango', mode: 'insensitive' } },
          { name: { contains: 'Chicken', mode: 'insensitive' } },
          { description: { contains: 'frango', mode: 'insensitive' } },
        ];
      }

      // Busca os produtos com categoria
      let products = await this.prisma.product.findMany({
        where: whereClause,
        take: 6,
        orderBy: [{ price: 'desc' }],
        include: {
          category: { select: { name: true } },
          Review: { select: { rating: true } },
        },
      }).catch(() => []);

      // Se o filtro específico não retornou nada, busca os 6 principais
      if (products.length === 0) {
        products = await this.prisma.product.findMany({
          where: { stock: { gt: 0 } },
          take: 6,
          orderBy: [{ price: 'desc' }],
          include: {
            category: { select: { name: true } },
            Review: { select: { rating: true } },
          },
        }).catch(() => []);
      }

      if (products.length > 0) {
        const title = message.includes('mais vendido')
          ? '🔥 **Alguns dos Mais Pedidos:**'
          : message.includes('bebida')
          ? '🥤 **Algumas de nossas Bebidas Geladas:**'
          : message.includes('batata') || message.includes('acompanha')
          ? '🍟 **Nossos Acompanhamentos Crocantes:**'
          : '🍔 **Alguns destaques do nosso cardápio:**';

        // Seleciona até 4 destaques para uma resposta leve e ágil
        const highlights = products.slice(0, 4);
        const listText = highlights
          .map((p) => `• **${p.name}** — R$ ${p.price.toFixed(2).replace('.', ',')}`)
          .join('\n');

        return this.sendResponse(session.id, {
          type: 'menu_highlights',
          reply: `${title}\n\n${listText}\n\n✨ Para ver fotos apetitosas, ingredientes completos e personalizar seu pedido, explore nosso cardápio completo no site logo abaixo! 👇`,
          data: {
            highlightNames: highlights.map((p) => p.name),
          },
          quickReplies: ['📖 Ver Cardápio no Site', '🔥 Mais Vendidos', '🍔 Ver Cardápio', '🛒 Meu Carrinho'],
          storeStatus,
        });
      }
    }

    // ─── 10. IA GENERATIVA (GEMINI) COM FALLBACK INTELIGENTE ───────
    if (this.aiService.isAvailable()) {
      try {
        const systemPrompt =
          `Você é o Chef Virtual e assistente da hamburgueria gourmet "The Burguer".\n` +
          `Informações essenciais:\n` +
          `- Horário: Terça a Domingo das 19h às 23h. Segunda fechado.\n` +
          `- Status atual da loja: ${storeStatus.isOpen ? 'ABERTA' : 'FECHADA'}.\n` +
          `- Cardápio: Hambúrgueres artesanais na brasa, smash burgers, batatas rústicas, bebidas geladas e sobremesas.\n` +
          `- Pagamento: Pix, Cartão de Crédito/Débito e Dinheiro.\n` +
          `- Entrega: 35 a 50 min em média, ou retirada grátis.\n` +
          `Regras de resposta:\n` +
          `- Seja cordial, simpático, apetitoso e direto (máximo 2 a 3 frases).\n` +
          `- Use emojis de comida com bom gosto.\n` +
          `- Sempre convide a ver o cardápio ou adicionar itens ao carrinho.`;

        const aiReply = await this.aiService.ask(rawMessage, systemPrompt);
        if (aiReply && aiReply.trim()) {
          return this.sendResponse(session.id, {
            reply: aiReply.trim(),
            quickReplies: ['🍔 Ver Cardápio', '🔥 Mais Vendidos', '📦 Rastrear Pedido', '🛒 Ver Carrinho'],
            storeStatus,
          });
        }
      } catch (err) {
        this.logger.warn(`Erro no Gemini AI fallback: ${err}`);
      }
    }

    // ─── 11. SAUDAÇÃO & MENU PADRÃO ───────────────────────────────
    const greeting = storeStatus.isOpen
      ? 'Olá! 🍔 Sou o assistente virtual da **The Burguer**.\nA chapa já está acesa! Como posso ajudar você hoje?'
      : 'Olá! 🍔 Sou o assistente virtual da **The Burguer**.\nNo momento a loja está fechada, mas você já pode explorar nosso cardápio!';

    return this.sendResponse(session.id, {
      reply: `${greeting}\n\n` +
        `• 🍔 Veja nosso **cardápio** com fotos e preços\n` +
        `• 📦 **Rastreie** o status do seu pedido ao vivo\n` +
        `• 🕒 Consulte nossos **horários e formas de pagamento**\n` +
        `• 💬 Fale com nossa equipe no **WhatsApp**`,
      quickReplies: ['🍔 Ver Cardápio', '🔥 Mais Vendidos', '📦 Rastrear Pedido', '🕒 Horário & Status'],
      storeStatus,
    });
  }

  /**
   * Envia a resposta e persiste no histórico assincronamente
   */
  private sendResponse(sessionId: string, response: Omit<ChatbotResponse, 'sessionId'>): ChatbotResponse {
    this.saveMessage(sessionId, 'assistant', response.reply);
    return {
      sessionId,
      ...response,
    };
  }

  /**
   * Grava mensagem no banco de dados sem travar a resposta
   */
  private async saveMessage(sessionId: string, role: string, content: string) {
    try {
      await this.prisma.chatMessage.create({
        data: {
          sessionId,
          role,
          content,
        },
      });
    } catch {
      // Não interrompe o fluxo caso ocorra erro ao gravar histórico
    }
  }
}