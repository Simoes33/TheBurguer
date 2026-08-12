import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}
  @Get('vapid-public-key')
  getPublicKey() {
    return { publicKey: this.pushService.getPublicKey() };
  }
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(@Req() req: any, @Body() subscription: any) {
    return this.pushService.subscribe(req.user.id, subscription);
  }
  @UseGuards(JwtAuthGuard)
  @Post('unsubscribe')
  unsubscribe(@Req() req: any, @Body('endpoint') endpoint: string) {
    return this.pushService.unsubscribe(req.user.id, endpoint);
  }
} 