import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum InvoiceStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 50 })
  mimeType: string;

  @Column({ length: 500 })
  filePath: string;

  @Column({ type: 'text', nullable: true })
  extractedText: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  detectedKwh: number | null;

  @Column({ type: 'int', nullable: true, comment: 'Invoice month (1-12)' })
  invoiceMonth: number | null;

  @Column({ type: 'int', nullable: true })
  invoiceYear: number | null;

  @Column({ type: 'enum', enum: InvoiceStatus, enumName: 'invoice_status_enum', default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
