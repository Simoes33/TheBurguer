import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/dto/create-user.dto';

@ApiTags('Instagram')
@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Returns the latest Instagram posts (cached for 30 min)' })
  getFeed() {
    return this.instagramService.getFeed();
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Force-refreshes the Instagram feed cache' })
  refreshCache() {
    return this.instagramService.refreshCache();
  }
}
