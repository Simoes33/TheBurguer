import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus, {
    message: 'Status deve ser um dos valores válidos: PENDING, PREPARING, READY, DELIVERED ou CANCELLED',
  })
  status: OrderStatus;
}
