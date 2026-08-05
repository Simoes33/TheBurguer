/**
 * Representa um trabalho de impressão a ser enviado a um Print Agent.
 *
 * O PrintJob é agnóstico ao tipo de impressora ou tecnologia de impressão.
 * Toda decisão sobre como imprimir cabe ao Agent que recebe o job.
 */
export interface PrintJob {
  /** Identificador único deste trabalho de impressão */
  jobId: string;

  /** ID do pedido que originou este job */
  orderId: string;

  /** ID da loja para roteamento ao Agent correto */
  storeId: string;

  /** Momento em que o job foi criado */
  createdAt: Date;

  /**
   * Dados completos do pedido serializados.
   * O Agent usará estes dados para formatar a impressão
   * conforme a tecnologia disponível (ESC/POS, ZPL, etc.).
   */
  payload: Record<string, any>;
}
