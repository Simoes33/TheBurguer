import { Body, Controller, Post, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  async message(@Req() req: any, @Body() dto: ChatbotMessageDto) {
    const userId = req.user?.id || dto.userId;
    return this.chatbotService.process(userId, dto);
  }
}