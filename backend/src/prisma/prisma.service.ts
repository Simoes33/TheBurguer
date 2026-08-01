import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

const RETRYABLE_ERROR_CODES = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024'];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();

    // Middleware de retry automático — protege TODAS as queries do
    // sistema contra quedas momentâneas de conexão. Isso é comum quando
    // o backend "acorda" depois de ficar inativo (Render free tier) e a
    // conexão guardada em memória já foi fechada pelo pooler do Supabase.
    this.$use(async (params, next) => {
      let attempt = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          return await next(params);
        } catch (error) {
          const isKnownRetryable =
            error instanceof Prisma.PrismaClientKnownRequestError &&
            RETRYABLE_ERROR_CODES.includes(error.code);

          const isConnectionError =
            error instanceof Prisma.PrismaClientInitializationError;

          const shouldRetry =
            (isKnownRetryable || isConnectionError) && attempt < MAX_RETRIES;

          if (!shouldRetry) {
            throw error;
          }

          attempt++;

          this.logger.warn(
            `Falha de conexão com o banco (tentativa ${attempt}/${MAX_RETRIES}) em ${params.model}.${params.action}. Reconectando...`,
          );

          try {
            await this.$disconnect();
            await this.$connect();
          } catch {
            // Se a reconexão falhar agora, a próxima iteração do loop tenta de novo
          }

          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}