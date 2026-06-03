import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto, UpdatePartnerDto } from './partner.dto';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly service: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'List all active partners' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner by id' })
  findOne(@Param('id') id: string) { return this.service.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Create partner' })
  create(@Body() dto: CreatePartnerDto) { return this.service.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: 'Update partner' })
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) { return this.service.update(+id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete partner' })
  remove(@Param('id') id: string) { return this.service.remove(+id); }
}
