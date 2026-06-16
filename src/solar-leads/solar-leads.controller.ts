import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';
import { SolarLeadsService } from './solar-leads.service';
import { CreateSolarLeadDto } from './solar-lead.dto';

@ApiTags('solar-leads')
@Controller('solar-leads')
export class SolarLeadsController {
  constructor(private readonly service: SolarLeadsService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit calculator lead',
    description:
      'Saves contact details + calculator inputs, runs the solar calculation, ' +
      'persists a snapshot and returns the full result. Use this when the user ' +
      'clicks "Dohvati ponude" after completing both wizard steps.',
  })
  @ApiCreatedResponse({ description: 'Lead saved, calculation result returned.' })
  create(@Body() dto: CreateSolarLeadDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all leads (admin use)' })
  findAll() {
    return this.service.findAll();
  }
}
