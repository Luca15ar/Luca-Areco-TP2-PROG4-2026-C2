import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('administrador')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('posts-by-user')
  @HttpCode(HttpStatus.OK)
  async getPostsByUser(@Query() query: StatsQueryDto) {
    return this.statsService.getPostsByUser(query);
  }

  @Get('comments-timeline')
  @HttpCode(HttpStatus.OK)
  async getCommentsTimeline(@Query() query: StatsQueryDto) {
    return this.statsService.getCommentsTimeline(query);
  }

  @Get('comments-by-post')
  @HttpCode(HttpStatus.OK)
  async getCommentsByPost(@Query() query: StatsQueryDto) {
    return this.statsService.getCommentsByPost(query);
  }
}
