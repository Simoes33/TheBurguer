import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HeartbeatService } from './heartbeat.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Inicializa o agendador de tarefas
    PrismaModule,
  ],
  providers: [HeartbeatService],
})
export class HeartbeatModule {}
