import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partner } from './common/entities/partner.entity';
import { Product } from './common/entities/product.entity';
import { Offer } from './offers/offer.entity';
import { Invoice } from './invoice-upload/invoice.entity';
import { SolarLead } from './solar-leads/solar-lead.entity';
import { AdminUser } from './auth/admin-user.entity';
import { PageView } from './analytics/page-view.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { PartnersModule } from './partners/partners.module';
import { ProductsModule } from './products/products.module';
import { OffersModule } from './offers/offers.module';
import { SolarCalculatorModule } from './solar-calculator/solar-calculator.module';
import { InvoiceUploadModule } from './invoice-upload/invoice-upload.module';
import { SolarOfferModule } from './solar-offers/solar-offer.module';
import { SolarLeadsModule } from './solar-leads/solar-leads.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

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
        entities: [Partner, Product, Offer, Invoice, SolarLead, AdminUser, PageView],
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
    SolarLeadsModule,
    AuthModule,
    AdminModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
