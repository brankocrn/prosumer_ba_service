import { Module } from '@nestjs/common';
import { SolarCalculatorController } from './solar-calculator.controller';
import { SolarCalculatorService } from './solar-calculator.service';

@Module({
  controllers: [SolarCalculatorController],
  providers: [SolarCalculatorService],
  exports: [SolarCalculatorService],
})
export class SolarCalculatorModule {}
