import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ChatbotMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}