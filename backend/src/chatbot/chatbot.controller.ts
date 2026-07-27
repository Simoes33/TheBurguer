import { Body, Controller, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';


@Controller('chatbot')
export class ChatbotController {


constructor(
    private readonly chatbotService: ChatbotService
){}



@Post()
async message(
    @Body() dto: ChatbotMessageDto
){

    return this.chatbotService.process(dto);

}


}