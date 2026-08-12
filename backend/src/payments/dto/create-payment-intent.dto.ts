import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  orderId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;
}
