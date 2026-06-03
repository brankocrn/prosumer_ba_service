import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partner } from '../common/entities/partner.entity';
import { Product } from '../common/entities/product.entity';
import { SolarCalculatorModule } from '../solar-calculator/solar-calculator.module';
import { SolarOfferController } from './solar-offer.controller';
import { SolarOfferService } from './solar-offer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partner, Product]),
    SolarCalculatorModule,
  ],
  controllers: [SolarOfferController],
  providers: [SolarOfferService],
})
export class SolarOfferModule {}
