import { Module, Global } from '@nestjs/common';
import { SseService } from './sse.service';

/**
 * Módulo Global: SseService fica disponível em toda a aplicação
 * sem precisar importar em cada módulo individualmente.
 */
@Global()
@Module({
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}
