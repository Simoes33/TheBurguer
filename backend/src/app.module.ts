import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { InstagramModule } from './instagram/instagram.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StorageModule } from './storage/storage.module';
import { PaymentsModule } from './payments/payments.module';
import { StatsModule } from './stats/stats.module';
import { SettingsModule } from './settings/settings.module';
import { SseModule } from './common/sse/sse.module';
import { SseController } from './common/sse/sse.controller';
import { PrinterModule } from './printer/printer.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    InstagramModule,
    CategoriesModule,
    ReviewsModule,
    StorageModule,
    PaymentsModule,
    StatsModule,
    SettingsModule,
    PrinterModule,
    SseModule,
    ChatbotModule,
    PushModule,
  ],
  controllers: [SseController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}