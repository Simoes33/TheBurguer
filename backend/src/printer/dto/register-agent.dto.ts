import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO enviado pelo Print Agent ao se registrar no backend.
 * O Agent deve emitir este payload imediatamente após conectar,
 * no evento PrinterEvent.REGISTER_AGENT.
 */
export class RegisterAgentDto {
  /**
   * Identificador único e persistente do dispositivo.
   * Deve ser gerado pelo Agent na primeira execução e mantido entre reinicializações.
   * Exemplo: UUID v4 armazenado em arquivo local.
   */
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  /**
   * Identificador da loja à qual este Agent pertence.
   * Utilizado para rotear pedidos ao Agent correto
   * quando múltiplos agents estiverem conectados.
   */
  @IsString()
  @IsNotEmpty()
  storeId: string;

  /**
   * Nome do host da máquina onde o Agent está executando.
   * Útil para diagnóstico e logs.
   */
  @IsString()
  @IsNotEmpty()
  hostname: string;

  /**
   * Versão do Print Agent.
   * Permite que o backend adapte o comportamento para versões antigas.
   */
  @IsString()
  @IsOptional()
  version?: string;
}
