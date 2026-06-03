import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Offer } from '../../offers/offer.entity';
import { Partner } from './partner.entity';

export enum ProductType {
  PANEL = 'panel',
  INVERTER = 'inverter',
  BATTERY = 'battery',
  MOUNTING = 'mounting',
  OTHER = 'other',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Partner, (partner) => partner.products, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: Partner;

  @Column()
  partnerId: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: ProductType, enumName: 'product_type_enum', default: ProductType.PANEL })
  type: ProductType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Power in Watts (for panels/inverters)' })
  powerWatts: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: 'Efficiency percentage' })
  efficiencyPercent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: 'Panel area in m²' })
  areaSqm: number;

  @Column({ length: 100, nullable: true })
  manufacturer: string;

  @Column({ length: 100, nullable: true })
  model: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Offer, (offer) => offer.product)
  offers: Offer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
