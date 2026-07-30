import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getBestsellerIds(limit = 3): Promise<string[]> {
    const popular = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    console.log('BESTSELLERS:', popular);

    return popular.map((item) => item.productId);
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      popularProducts,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),

      this.prisma.order.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),

      this.prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }),

      this.prisma.order.aggregate({
        where: {
          createdAt: {
            gte: today,
          },
        },
        _sum: {
          total: true,
        },
      }),

      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),

      this.prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Busca os nomes dos produtos populares
    const productIds = popularProducts.map(
      (product) => product.productId,
    );

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productMap = new Map(
      products.map((product) => [product.id, product.name]),
    );

    const popularProductsWithNames = popularProducts.map((product) => ({
      name: productMap.get(product.productId) || 'Desconhecido',
      quantity: product._sum.quantity || 0,
    }));

    // Vendas nos últimos 7 dias
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();

      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayRevenue = orders
        .filter(
          (order) =>
            order.createdAt >= d &&
            order.createdAt < nextD,
        )
        .reduce(
          (sum, order) => sum + order.total,
          0,
        );

      last7Days.push({
        date: d.toLocaleDateString('pt-BR', {
          weekday: 'short',
        }),
        revenue:
          Math.round(dayRevenue * 100) / 100,
      });
    }

    return {
      overview: {
        totalOrders,
        todayOrders,
        totalRevenue:
          totalRevenue._sum.total || 0,
        todayRevenue:
          todayRevenue._sum.total || 0,
      },

      popularProducts: popularProductsWithNames,

      salesChart: last7Days,

      recentOrders,
    };
  }
}