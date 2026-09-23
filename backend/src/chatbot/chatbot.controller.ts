import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Envia mensagem para o assistente virtual' })
  async message(@Req() req: any, @Body() dto: ChatbotMessageDto) {
    // userId prioritariamente extraído com segurança do token JWT
    const userId = req.user?.id || dto.userId;
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