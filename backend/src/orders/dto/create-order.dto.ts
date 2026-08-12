import { IsArray, IsNumber, IsString, ValidateNested, IsOptional, Min, Max, IsInt, ArrayMaxSize, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  productId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  observation?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
