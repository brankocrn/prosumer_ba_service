import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './offer.dto';

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly service: OffersService) {}

  @Get()
  @ApiOperation({ summary: 'List all active offers' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer by id' })
  findOne(@Param('id') id: string) { return this.service.findOne(+id); }

  @Post()
  @ApiOperation({ summary: 'Create offer' })
  create(@Body() dto: CreateOfferDto) { return this.service.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: 'Update offer' })
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto) { return this.service.update(+id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Expire offer' })
  remove(@Param('id') id: string) { return this.service.remove(+id); }
}
