import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from '../common/entities/partner.entity';
import { CreatePartnerDto, UpdatePartnerDto } from './partner.dto';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
  ) {}

  findAll() {
    return this.partnerRepo.find({ where: { isActive: true } });
  }

  async findOne(id: number) {
    const partner = await this.partnerRepo.findOne({ where: { id }, relations: { offers: true } });
    if (!partner) throw new NotFoundException(`Partner ${id} not found`);
    return partner;
  }

  create(dto: CreatePartnerDto) {
    const partner = this.partnerRepo.create(dto);
    return this.partnerRepo.save(partner);
  }

  async update(id: number, dto: UpdatePartnerDto) {
    await this.findOne(id);
    await this.partnerRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.partnerRepo.update(id, { isActive: false });
  }
}
