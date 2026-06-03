import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SolarCalculatorService } from './solar-calculator.service';
import { CalculateSolarDto } from './solar-calculator.dto';

@ApiTags('solar-calculator')
@Controller('solar-calculator')
export class SolarCalculatorController {
  constructor(private readonly service: SolarCalculatorService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate recommended solar plant size',
    description: 'Returns system size, panel count, production estimate, savings and payback period based on location, roof area and annual consumption.',
  })
  calculate(@Body() dto: CalculateSolarDto) {
    return this.service.calculate(dto);
  }
}
