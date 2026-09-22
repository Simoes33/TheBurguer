import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @ApiOperation({ summary: 'Envia mensagem para o assistente virtual' })
  async message(@Req() req: any, @Body() dto: ChatbotMessageDto) {
    // userId extraído apenas do token JWT — nunca do body (evita IDOR)
    const userId = req.user?.id;
    return this.chatbotService.process(userId, dto);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reinicia o histórico e estado da sessão do chatbot' })
  async resetSession(@Body('sessionId') sessionId?: string) {
    return this.chatbotService.reset(sessionId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Retorna o status atual da loja para o chatbot' })
  async getStatus() {
    return this.chatbotService.getStoreStatus();
  }
}