import { Module } from '@nestjs/common';
import { SolarCalculatorController } from './solar-calculator.controller';
import { SolarCalculatorService } from './solar-calculator.service';
import { PvgisService } from './pvgis.service';

@Module({
  controllers: [SolarCalculatorController],
  providers: [SolarCalculatorService, PvgisService],
  exports: [SolarCalculatorService, PvgisService],
})
export class SolarCalculatorModule {}
