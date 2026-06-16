import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Offer } from '../../offers/offer.entity';
import { Product } from './product.entity';

@Entity('partners')
export class Partner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ length: 100, nullable: true, comment: 'City where the partner operates' })
  city: string;

  @Column({ length: 10, nullable: true, comment: 'Country code, e.g. BiH or HR' })
  country: string;

  @Column({ type: 'text', nullable: true, comment: 'Short description shown on the marketplace card' })
  description: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, default: null, comment: 'Aggregate rating 0–5' })
  rating: number;

  @Column({ type: 'int', nullable: true, default: null, comment: 'Number of completed projects' })
  projectCount: number;

  @Column({ length: 50, nullable: true, default: 'Verified', comment: 'Badge tier: Premium or Verified' })
  badge: string;

  @Column({ type: 'simple-array', nullable: true, comment: 'Comma-separated brand/skill tags shown as chips' })
  tags: string[];

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true, comment: 'Partner location latitude' })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true, comment: 'Partner location longitude' })
  longitude: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Offer, (offer) => offer.partner)
  offers: Offer[];

  @OneToMany(() => Product, (product) => product.partner)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
