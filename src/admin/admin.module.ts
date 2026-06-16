import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarLead } from '../solar-leads/solar-lead.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolarLead]),
    AuthModule,
    AnalyticsModule,   // gives access to PageView repository
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
