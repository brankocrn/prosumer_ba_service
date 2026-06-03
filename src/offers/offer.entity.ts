import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Partner } from '../common/entities/partner.entity';
import { Product } from '../common/entities/product.entity';

export enum OfferStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Partner, (partner) => partner.offers)
  @JoinColumn({ name: 'partnerId' })
  partner: Partner;

  @Column()
  partnerId: number;

  @ManyToOne(() => Product, (product) => product.offers)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: 'Discount percentage' })
  discountPercent: number;

  @Column({ type: 'int', nullable: true, comment: 'Warranty in years' })
  warrantyYears: number;

  @Column({ type: 'enum', enum: OfferStatus, enumName: 'offer_status_enum', default: OfferStatus.ACTIVE })
  status: OfferStatus;

  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
