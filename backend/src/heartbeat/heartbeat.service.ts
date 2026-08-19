import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HeartbeatService {
  private readonly logger = new Logger(HeartbeatService.name);
  private consecutiveFailures = 0;
  private readonly MAX_FAILURES = 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa um SELECT 1 leve a cada 4 minutos para manter a conexão
   * com o Supabase (free tier) ativa e evitar que o pooler encerre
   * as conexões inativas.
   *
   * O Supabase pausa o banco após 7 dias sem requisições via Dashboard.
   * Esta task garante que queries continuem chegando ao banco via Prisma,
   * mantendo o pooler e a conexão aquecidos.
   */
  @Cron('0 */4 * * * *') // a cada 4 minutos
  async keepAlive(): Promise<void> {
    try {
      // Query mínima — apenas confirma que o banco responde
      await this.prisma.$queryRaw`SELECT 1`;

      if (this.consecutiveFailures > 0) {
        this.logger.log(
          `✅ Heartbeat restaurado após ${this.consecutiveFailures} falha(s) consecutiva(s).`,
        );
      } else {
        this.logger.debug('💓 Heartbeat Supabase OK — conexão ativa.');
      }

      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures++;

      this.logger.error(
        `❌ Heartbeat falhou (${this.consecutiveFailures}/${this.MAX_FAILURES}): ${(error as Error).message}`,
      );

      if (this.consecutiveFailures >= this.MAX_FAILURES) {
        this.logger.error(
          `🚨 ${this.MAX_FAILURES} falhas consecutivas no heartbeat. ` +
            'Verifique a conectividade com o Supabase.',
        );
      }

      // Tenta reconectar explicitamente após falha
      try {
        await this.prisma.$disconnect();
        await this.prisma.$connect();
        this.logger.warn('🔄 Reconexão com Supabase tentada após heartbeat falhar.');
      } catch (reconnectError) {
        this.logger.error(
          `Reconexão falhou: ${(reconnectError as Error).message}`,
        );
      }
    }
  }

  /**
   * Roda uma vez na inicialização para confirmar que o banco está acessível
   * logo após o servidor subir.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('🚀 HeartbeatService inicializado — verificando Supabase...');
    await this.keepAlive();
  }
}
