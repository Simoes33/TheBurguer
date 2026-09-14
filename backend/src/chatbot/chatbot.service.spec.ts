import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let prisma: any;
  let aiService: any;

  const mockPrisma = {
    setting: {
      findUnique: jest.fn().mockResolvedValue({ key: 'isOpen', value: 'true' }),
    },
    chatSession: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'session_test_123', state: 'START' }),
      update: jest.fn().mockResolvedValue({ id: 'session_test_123', state: 'START' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    chatMessage: {
      create: jest.fn().mockResolvedValue({ id: 'msg_123' }),
    },
    order: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'prod_1',
          name: 'Classic Smash Burger',
          description: 'Hambúrguer 160g, queijo cheddar derretido e molho especial.',
          price: 29.9,
          imageUrl: 'https://example.com/burger.jpg',
          category: { name: 'Smash' },
          Review: [{ rating: 5 }, { rating: 4 }],
        },
      ]),
    },
  };

  const mockAiService = {
    isAvailable: jest.fn().mockReturnValue(false),
    ask: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    prisma = module.get(PrismaService);
    aiService = module.get(AiService);
    jest.clearAllMocks();
  });

  it('deve ser instanciado corretamente', () => {
    expect(service).toBeDefined();
  });

  it('deve retornar status da loja aberto', async () => {
    mockPrisma.setting.findUnique.mockResolvedValueOnce({ key: 'isOpen', value: 'true' });
    const status = await service.getStoreStatus();
    expect(status.isOpen).toBe(true);
    expect(status.label).toContain('Aberto');
  });

  it('deve responder à intenção de cardápio com produtos estruturados', async () => {
    const response = await service.process('user_123', {
      message: 'Gostaria de ver o cardápio de lanches',
      sessionId: 'session_test_123',
    });

    expect(response.type).toBe('products');
    expect(response.data?.products).toHaveLength(1);
    expect(response.data.products[0].name).toBe('Classic Smash Burger');
    expect(response.quickReplies).toContain('🔥 Mais Vendidos');
  });

  it('deve responder sobre horário e formas de pagamento', async () => {
    const responsePagamento = await service.process(undefined, {
      message: 'Quais as formas de pagamento aceitas?',
    });
    expect(responsePagamento.reply).toContain('PIX');
    expect(responsePagamento.reply).toContain('Cartão');

    const responseHorario = await service.process(undefined, {
      message: 'Qual o horário de funcionamento?',
    });
    expect(responseHorario.reply).toContain('19:00 às 23:00');
  });

  it('deve rastrear pedido ativo do usuário autenticado', async () => {
    mockPrisma.order.findMany.mockResolvedValueOnce([
      {
        id: 'order_abc_12345678',
        userId: 'user_123',
        status: 'PREPARING',
        total: 58.5,
        items: [
          { quantity: 2, product: { name: 'Classic Smash Burger' } },
        ],
      },
    ]);

    const response = await service.process('user_123', {
      message: 'onde está meu pedido?',
    });

    expect(response.type).toBe('order');
    expect(response.data?.order?.id).toBe('order_abc_12345678');
    expect(response.reply).toContain('Em preparo na chapa');
    expect(response.quickReplies).toContain('Acompanhar Pedido ao Vivo');
  });

  it('deve permitir resetar a sessão do chatbot', async () => {
    const resetResult = await service.reset('session_test_123');
    expect(resetResult.success).toBe(true);
    expect(mockPrisma.chatSession.deleteMany).toHaveBeenCalledWith({
      where: { id: 'session_test_123' },
    });
  });
});
