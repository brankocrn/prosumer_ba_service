import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceUploadController } from './invoice-upload.controller';
import { InvoiceUploadService } from './invoice-upload.service';
import { InvoiceParserService } from './invoice-parser.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice])],
  controllers: [InvoiceUploadController],
  providers: [InvoiceUploadService, InvoiceParserService],
})
export class InvoiceUploadModule {}
