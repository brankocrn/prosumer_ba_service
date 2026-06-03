import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SolarOfferService } from './solar-offer.service';
import { GenerateSolarOffersDto } from './solar-offer.dto';

@ApiTags('solar-offers')
@Controller('solar-offers')
export class SolarOfferController {
  constructor(private readonly service: SolarOfferService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate 3 installation offers from closest partners',
    description:
      'Calculates the required solar system size, then finds the 3 nearest active partners ' +
      'and builds a full offer for each one including panels, inverter, mounting hardware ' +
      'and any other catalogue products, with pricing and payback estimate.',
  })
  generate(@Body() dto: GenerateSolarOffersDto) {
    return this.service.generate(dto);
  }
}
