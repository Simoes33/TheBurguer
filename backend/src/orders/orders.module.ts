import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { PrinterModule } from './printer/printer.module';

@Module({
  imports: [PrismaModule, SettingsModule,PrinterModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // Exporta para uso no PaymentsModule (webhook do Stripe)
  
})
export class OrdersModule {}
