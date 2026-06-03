import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partner } from './common/entities/partner.entity';
import { Product } from './common/entities/product.entity';
import { Offer } from './offers/offer.entity';
import { Invoice } from './invoice-upload/invoice.entity';
import { PartnersModule } from './partners/partners.module';
import { ProductsModule } from './products/products.module';
import { OffersModule } from './offers/offers.module';
import { SolarCalculatorModule } from './solar-calculator/solar-calculator.module';
import { InvoiceUploadModule } from './invoice-upload/invoice-upload.module';
import { SolarOfferModule } from './solar-offers/solar-offer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'solar_app'),
        entities: [Partner, Product, Offer, Invoice],
        synchronize: true,
        logging: config.get('NODE_ENV') !== 'production',
      }),
    }),
    PartnersModule,
    ProductsModule,
    OffersModule,
    SolarCalculatorModule,
    InvoiceUploadModule,
    SolarOfferModule,
  ],
})
export class AppModule {}
