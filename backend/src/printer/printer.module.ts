import { Module } from '@nestjs/common';
import { PrinterGateway } from './gateway/printer.gateway';
import { PrinterService } from './services/printer.service';


/**
 * PrinterModule — Módulo de comunicação com Print Agents.
 *
 * Responsabilidades:
 *  - Gerenciar conexões WebSocket de Print Agents via PrinterGateway
 *  - Expor PrinterService para que outros módulos possam enviar pedidos
 *
 * NÃO contém qualquer conhecimento sobre impressoras físicas,
 * protocolos de impressão (ESC/POS, ZPL, etc.) ou fabricantes.
 * Toda essa lógica pertence ao Print Agent.
 */
@Module({
  providers: [
    PrinterGateway,
    PrinterService,
  ],
  exports: [
    PrinterService,
  ],
})
export class PrinterModule {}
