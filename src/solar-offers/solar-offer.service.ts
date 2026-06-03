import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from '../common/entities/partner.entity';
import { Product, ProductType } from '../common/entities/product.entity';
import { SolarCalculatorService } from '../solar-calculator/solar-calculator.service';
import {
  GenerateSolarOffersDto,
  GenerateSolarOffersResponseDto,
  SolarOfferDto,
  ProductLineDto,
} from './solar-offer.dto';

const INSTALLATION_RATE = 0.20;
const ELECTRICITY_PRICE_EUR_KWH = 0.15;

@Injectable()
export class SolarOfferService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnerRepo: Repository<Partner>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly calculator: SolarCalculatorService,
  ) {}

  async generate(dto: GenerateSolarOffersDto): Promise<GenerateSolarOffersResponseDto> {
    // ── 1. Solar sizing ───────────────────────────────────────────────────────
    const calc = this.calculator.calculate(dto);

    // ── 2. Active partners with coordinates + their products ──────────────────
    const partners = await this.partnerRepo.find({
      where: { isActive: true },
      relations: { products: true },
    });
    const geoPartners = partners.filter((p) => p.latitude != null && p.longitude != null);

    if (geoPartners.length === 0) {
      throw new BadRequestException(
        'No active partners with location data found. Please add lat/lng to partners first.',
      );
    }

    // ── 3. Sort by distance, take 3 closest that have at least one panel ─────
    const withDistance = geoPartners
      .map((p) => ({
        partner: p,
        distanceKm: this.haversineKm(dto.latitude, dto.longitude, Number(p.latitude), Number(p.longitude)),
        panels: p.products.filter((pr) => pr.isActive && (pr.type as string) === ProductType.PANEL),
      }))
      .filter((p) => p.panels.length > 0)        // must have at least one panel
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);

    if (withDistance.length === 0) {
      throw new BadRequestException(
        'No active partners with panel products found. Please assign panel products to partners first.',
      );
    }

    // ── 4. Build one offer per partner using their own products ───────────────
    const offers: SolarOfferDto[] = withDistance.map(({ partner, distanceKm }) => {
      const activeProducts = partner.products.filter((p) => p.isActive);
      const panels    = activeProducts.filter((p) => (p.type as string) === ProductType.PANEL);
      const inverters = activeProducts.filter((p) => (p.type as string) === ProductType.INVERTER);
      const mountings = activeProducts.filter((p) => (p.type as string) === ProductType.MOUNTING);
      const others    = activeProducts.filter((p) =>
        !([ProductType.PANEL, ProductType.INVERTER, ProductType.MOUNTING] as string[]).includes(p.type),
      );

      // Best panel: highest efficiency, fallback to first
      const panel = panels.sort((a, b) =>
        (Number(b.efficiencyPercent) || 0) - (Number(a.efficiencyPercent) || 0),
      )[0];

      const panelWatts = panel.powerWatts ? Number(panel.powerWatts) : 400;
      const numberOfPanels = Math.ceil((calc.recommendedSystemKw * 1000) / panelWatts);
      const actualSystemKw = Math.round((numberOfPanels * panelWatts) / 1000 * 100) / 100;

      // Best inverter: smallest one that covers the system kW
      const inverter = inverters.length > 0
        ? inverters
            .filter((i) => !i.powerWatts || Number(i.powerWatts) / 1000 >= actualSystemKw)
            .sort((a, b) => Number(a.powerWatts ?? 0) - Number(b.powerWatts ?? 0))[0]
            ?? inverters.sort((a, b) => Number(b.powerWatts ?? 0) - Number(a.powerWatts ?? 0))[0]
        : null;

      // Cheapest mounting kit
      const mounting = mountings.length > 0
        ? mountings.sort((a, b) => Number(a.price) - Number(b.price))[0]
        : null;

      const panelLine    = this.buildLine(panel, numberOfPanels, {
        'Power (W)': panel.powerWatts ?? 400,
        'Efficiency (%)': panel.efficiencyPercent ?? '-',
        'Area (m²)': panel.areaSqm ?? '-',
      });
      const inverterLine = inverter
        ? this.buildLine(inverter, 1, { 'Rated power (kW)': Number(inverter.powerWatts ?? 0) / 1000 })
        : null;
      const mountingLine = mounting
        ? this.buildLine(mounting, numberOfPanels, { 'Panels covered': numberOfPanels })
        : null;
      const additionalLines = others.map((p) => this.buildLine(p, 1, {}));

      const equipmentTotal =
        panelLine.subtotalEur +
        (inverterLine?.subtotalEur ?? 0) +
        (mountingLine?.subtotalEur ?? 0) +
        additionalLines.reduce((s, l) => s + l.subtotalEur, 0);

      const installationCost = Math.round(equipmentTotal * INSTALLATION_RATE);
      const totalEur = equipmentTotal + installationCost;
      const annualProduction = actualSystemKw * calc.peakSunHoursPerDay * 365 * 0.8;
      const annualSavings = Math.round(Math.min(annualProduction, dto.annualKwh) * ELECTRICITY_PRICE_EUR_KWH);
      const paybackYears = annualSavings > 0 ? Math.round((totalEur / annualSavings) * 10) / 10 : 0;

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        partnerAddress: partner.address,
        partnerPhone: partner.phone,
        partnerEmail: partner.email,
        distanceKm: Math.round(distanceKm * 10) / 10,
        systemKw: actualSystemKw,
        numberOfPanels,
        estimatedAnnualProductionKwh: Math.round(annualProduction),
        selfSufficiencyPercent: Math.round(Math.min(100, (annualProduction / dto.annualKwh) * 100) * 10) / 10,
        co2SavedKgPerYear: Math.round(annualProduction * 0.4),
        panels: panelLine,
        inverter: inverterLine,
        mounting: mountingLine,
        additionalProducts: additionalLines,
        subtotalEquipmentEur: equipmentTotal,
        estimatedInstallationEur: installationCost,
        totalEur,
        estimatedAnnualSavingsEur: annualSavings,
        estimatedPaybackYears: paybackYears,
      };
    });

    return { calculation: calc, offers };
  }

  private buildLine(product: Product, quantity: number, specs: Record<string, string | number>): ProductLineDto {
    const unitPrice = Number(product.price);
    return {
      productId: product.id,
      productName: product.name,
      manufacturer: product.manufacturer ?? '',
      model: product.model ?? '',
      unitPriceEur: unitPrice,
      quantity,
      subtotalEur: Math.round(unitPrice * quantity * 100) / 100,
      specs,
    };
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number) { return (deg * Math.PI) / 180; }
}
