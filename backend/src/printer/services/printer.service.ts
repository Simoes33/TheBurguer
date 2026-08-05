import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrinterGateway } from '../gateway/printer.gateway';
import { PrintJob } from '../interfaces/print-job.interface';


@Injectable()
export class PrinterService {

  private readonly logger = new Logger(PrinterService.name);


  constructor(
    private readonly printerGateway: PrinterGateway,
  ) {}


  /**
   * Ponto de entrada principal para o restante do sistema.
   *
   * Recebe um pedido (em qualquer forma), monta um PrintJob e o encaminha
   * ao Print Agent da loja via WebSocket.
   *
   * Não lança exceção caso nenhum Agent esteja conectado — apenas loga aviso.
   * Isso garante que a criação do pedido não seja bloqueada por indisponibilidade
   * da impressora.
   *
   * @param order - Objeto do pedido retornado pelo banco de dados.
   *                Deve conter ao menos `id` e `userId` para montar o job.
   */
  async sendOrder(order: Record<string, any>): Promise<void> {

    /**
     * storeId: por ora assume-se ambiente single-tenant (uma loja).
     * No futuro, o pedido ou o usuário poderá carregar o storeId explicitamente.
     */
    const storeId: string =
      order.storeId ?? process.env.STORE_ID ?? 'default';

    const job: PrintJob = {
      jobId:     uuidv4(),
      orderId:   order.id,
      storeId,
      createdAt: new Date(),
      payload:   order,
    };

    const delivered = this.printerGateway.sendJobToStore(storeId, job);

    if (!delivered) {
      this.logger.warn(
        `⚠️  Nenhum Print Agent conectado para a loja "${storeId}" — jobId: ${job.jobId} | orderId: ${job.orderId}. O pedido foi salvo normalmente.`,
      );
      return;
    }

    this.logger.log(
      `📨 PrintJob enfileirado — jobId: ${job.jobId} | orderId: ${job.orderId} | storeId: ${storeId}`,
    );
  }
}
