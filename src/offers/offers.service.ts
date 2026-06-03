import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from './offer.entity';
import { CreateOfferDto, UpdateOfferDto } from './offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
  ) {}

  findAll() {
    return this.offerRepo.find({
      where: { status: OfferStatus.ACTIVE },
      relations: { partner: true, product: true },
    });
  }

  async findOne(id: number) {
    const offer = await this.offerRepo.findOne({ where: { id }, relations: { partner: true, product: true } });
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);
    return offer;
  }

  create(dto: CreateOfferDto) {
    const offer = this.offerRepo.create(dto);
    return this.offerRepo.save(offer);
  }

  async update(id: number, dto: UpdateOfferDto) {
    await this.findOne(id);
    await this.offerRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.offerRepo.update(id, { status: OfferStatus.EXPIRED });
  }
}
