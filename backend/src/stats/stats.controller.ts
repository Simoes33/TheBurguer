import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/dto/create-user.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  // Rota pública — só os IDs dos mais vendidos, sem dados sensíveis
  @Get('bestsellers')
  getBestsellers(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 3;
    return this.statsService.getBestsellerIds(parsedLimit);
  }
}