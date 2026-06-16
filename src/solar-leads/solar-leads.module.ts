import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarLead } from './solar-lead.entity';
import { SolarLeadsController } from './solar-leads.controller';
import { SolarLeadsService } from './solar-leads.service';
import { SolarCalculatorModule } from '../solar-calculator/solar-calculator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolarLead]),
    SolarCalculatorModule,          // re-uses SolarCalculatorService + PvgisService
  ],
  controllers: [SolarLeadsController],
  providers: [SolarLeadsService],
})
export class SolarLeadsModule {}
