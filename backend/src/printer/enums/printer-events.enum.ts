/**
 * Eventos do protocolo WebSocket entre o backend e os Print Agents.
 * Todos os eventos emitidos ou recebidos pelo PrinterGateway devem
 * referenciar estas constantes para evitar strings mágicas.
 */
export enum PrinterEvent {
  /**
   * Emitido pelo Agent logo após conectar.
   * Payload: RegisterAgentDto
   */
  REGISTER_AGENT = 'register_agent',

  /**
   * Emitido periodicamente pelo Agent para indicar que está ativo.
   * Payload: { deviceId: string }
   */
  HEARTBEAT = 'heartbeat',

  /**
   * Emitido pelo backend ao Agent para solicitar a impressão de um pedido.
   * Payload: PrintJob
   */
  PRINT_ORDER = 'print_order',

  /**
   * Emitido pelo Agent ao backend confirmando impressão bem-sucedida.
   * Payload: PrintResultDto
   */
  PRINT_SUCCESS = 'print_success',

  /**
   * Emitido pelo Agent ao backend reportando falha na impressão.
   * Payload: PrintResultDto
   */
  PRINT_ERROR = 'print_error',
}
