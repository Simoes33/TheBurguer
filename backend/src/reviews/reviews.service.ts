import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, productId: string, rating: number, comment?: string) {
    const existingReview = await this.prisma.review.findFirst({
      where: { userId, productId },
    });

    if (existingReview) {
      throw new BadRequestException('Você já avaliou este produto.');
    }

    return this.prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        productId,
      },
      include: { user: { select: { name: true } } },
    });
  }

  async findByProduct(productId: string, limit: number = 3) {
    const take = Math.max(1, Math.min(Number(limit) || 3, 50));
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async findAll() {
    return this.prisma.review.findMany({
      include: { 
        user: { select: { name: true, email: true } },
        product: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
