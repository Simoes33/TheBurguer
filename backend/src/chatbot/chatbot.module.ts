import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { AiService } from './ai.service';
import { ChatSessionService } from './chat-session.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, AiService, ChatSessionService],
  exports: [ChatbotService],
})
export class ChatbotModule {}