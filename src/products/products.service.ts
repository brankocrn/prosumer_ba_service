import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../common/entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  findAll(partnerId?: number) {
    return this.productRepo.find({
      where: { isActive: true, ...(partnerId ? { partnerId } : {}) },
      relations: { partner: true },
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id }, relations: { partner: true } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  create(dto: CreateProductDto) {
    const product = this.productRepo.create(dto);
    return this.productRepo.save(product);
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    await this.productRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.productRepo.update(id, { isActive: false });
  }
}
