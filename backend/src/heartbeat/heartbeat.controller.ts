import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HeartbeatService } from './heartbeat.service';

@Controller()
@SkipThrottle() // Isenta health checks do rate limiting global
export class HeartbeatController {
  constructor(private readonly heartbeatService: HeartbeatService) {}

  /**
   * Endpoint de verificação de saúde da aplicação e conectividade com o banco.
   * Usado por UptimeRobot, cron jobs externos e monitoramento de status.
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    return this.heartbeatService.checkHealth();
  }

  /**
   * Endpoint específico de keep-alive / ping.
   */
  @Get('heartbeat/ping')
  @HttpCode(HttpStatus.OK)
  async ping() {
    return this.heartbeatService.checkHealth();
  }
}
