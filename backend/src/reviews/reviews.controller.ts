import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/dto/create-user.dto';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  create(@Request() req: any, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, createReviewDto.productId, createReviewDto.rating, createReviewDto.comment);
  }

  @Get('product/:productId')
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Quantidade máxima de avaliações (padrão 3)' })
  findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findByProduct(productId, limit);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.reviewsService.findAll();
  }
}
