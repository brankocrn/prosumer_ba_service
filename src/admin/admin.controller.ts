import {
  Controller, Get, Patch, Param, Body,
  Query, UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminService } from './admin.service';
import { LeadStatus } from '../solar-leads/solar-lead.entity';

class UpdateStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Dashboard metrics' })
  metrics() {
    return this.admin.getMetrics();
  }

  @Get('leads')
  @ApiOperation({ summary: 'Paginated, sortable, filterable leads list' })
  @ApiQuery({ name: 'page',    required: false, type: Number })
  @ApiQuery({ name: 'limit',   required: false, type: Number })
  @ApiQuery({ name: 'sortBy',  required: false, type: String })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'status',  required: false, enum: LeadStatus })
  @ApiQuery({ name: 'search',  required: false, type: String })
  getLeads(
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy')  sortBy?: string,
    @Query('sortDir') sortDir?: 'asc' | 'desc',
    @Query('status')  status?: LeadStatus,
    @Query('search')  search?: string,
  ) {
    return this.admin.getLeads({ page, limit, sortBy, sortDir, status, search });
  }

  @Patch('leads/:id/status')
  @ApiOperation({ summary: 'Update lead status' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.admin.updateLeadStatus(id, dto.status);
  }
}
