import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageView } from './page-view.entity';

class TrackPageDto {
  @IsString()
  @MaxLength(255)
  page: string;

  @IsString()
  @MaxLength(64)
  @IsOptional()
  sessionId?: string;
}

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    @InjectRepository(PageView)
    private readonly repo: Repository<PageView>,
  ) {}

  @Post('pageview')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a page view (fire-and-forget, public)' })
  async track(@Body() dto: TrackPageDto): Promise<void> {
    await this.repo.save(this.repo.create({ page: dto.page, sessionId: dto.sessionId }));
  }
}
