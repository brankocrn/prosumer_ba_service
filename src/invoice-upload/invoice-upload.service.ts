import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { InvoiceParserService } from './invoice-parser.service';

export interface AnnualUsageSummary {
  totalKwh: number;
  monthsDetected: number;
  estimatedAnnualKwh: number;
  invoices: { id: number; month: number | null; year: number | null; kwh: number }[];
}

@Injectable()
export class InvoiceUploadService {
  private readonly logger = new Logger(InvoiceUploadService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly parser: InvoiceParserService,
  ) {}

  async upload(file: Express.Multer.File): Promise<Invoice> {
    const invoice = this.invoiceRepo.create({
      fileName: file.originalname,
      mimeType: file.mimetype,
      filePath: file.path,
      status: InvoiceStatus.PENDING,
    });

    await this.invoiceRepo.save(invoice);
    await this.processInvoice(invoice, file.path, file.mimetype);
    return invoice;
  }

  private async processInvoice(invoice: Invoice, filePath: string, mimeType: string) {
    try {
      const parsed = await this.parser.parse(filePath, mimeType);
      invoice.extractedText = parsed.text;
      invoice.detectedKwh = parsed.kwh;
      invoice.invoiceMonth = parsed.month;
      invoice.invoiceYear = parsed.year;
      invoice.status = InvoiceStatus.PROCESSED;
    } catch (err) {
      invoice.status = InvoiceStatus.FAILED;
      invoice.errorMessage = err.message;
      this.logger.error('Invoice processing failed', err);
    }

    await this.invoiceRepo.save(invoice);
  }

  findAll() {
    return this.invoiceRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const inv = await this.invoiceRepo.findOne({ where: { id } });
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`);
    return inv;
  }

  async getAnnualUsageSummary(): Promise<AnnualUsageSummary> {
    const invoices = await this.invoiceRepo.find({
      where: { status: InvoiceStatus.PROCESSED },
      order: { invoiceYear: 'DESC', invoiceMonth: 'DESC' },
    });

    const withKwh = invoices.filter((i) => i.detectedKwh && i.invoiceMonth && i.invoiceYear);
    const totalKwh = withKwh.reduce((sum, i) => sum + Number(i.detectedKwh), 0);
    const months = withKwh.length;
    const estimatedAnnual = months > 0 ? Math.round((totalKwh / months) * 12) : 0;

    return {
      totalKwh: Math.round(totalKwh),
      monthsDetected: months,
      estimatedAnnualKwh: estimatedAnnual,
      invoices: withKwh.map((i) => ({
        id: i.id,
        month: i.invoiceMonth,
        year: i.invoiceYear,
        kwh: Number(i.detectedKwh),
      })),
    };
  }
}
