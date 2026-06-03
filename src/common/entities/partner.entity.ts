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
