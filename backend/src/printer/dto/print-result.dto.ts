import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO enviado pelo Print Agent ao backend após tentar imprimir.
 * Utilizado tanto no evento PRINT_SUCCESS quanto no PRINT_ERROR.
 */
export class PrintResultDto {
  /**
   * ID do trabalho de impressão (PrintJob.jobId).
   * Permite que o backend correlacione a resposta com o job enviado.
   */
  @IsString()
  @IsNotEmpty()
  jobId: string;

  /**
   * ID do dispositivo que processou o job.
   */
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  /**
   * Mensagem descritiva do resultado (opcional).
   * No caso de erro, deve conter o motivo da falha.
   */
  @IsString()
  @IsOptional()
  message?: string;
}
