import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolarLead } from './solar-lead.entity';
import { CreateSolarLeadDto, SolarLeadResponseDto } from './solar-lead.dto';
import { SolarCalculatorService } from '../solar-calculator/solar-calculator.service';

@Injectable()
export class SolarLeadsService {
  constructor(
    @InjectRepository(SolarLead)
    private readonly leadRepo: Repository<SolarLead>,
    private readonly calculator: SolarCalculatorService,
  ) {}

  async create(dto: CreateSolarLeadDto): Promise<SolarLeadResponseDto> {
    const annualKwh = Math.round((dto.monthlyBillEur * 12) / 0.25);

    // Run the full calculation (PVGIS → fallback)
    const calc = await this.calculator.calculate({
      latitude:           dto.latitude  ?? 43.85,   // Sarajevo as last resort
      longitude:          dto.longitude ?? 18.41,
      roofAreaSqm:        dto.roofAreaSqm,
      annualKwh,
      roofTiltDegrees:    dto.roofTiltDegrees,
      roofAzimuthDegrees: dto.roofAzimuthDegrees,
    });

    // Persist the lead with a snapshot of the result
    const lead = this.leadRepo.create({
      name:             dto.name,
      email:            dto.email,
      phone:            dto.phone,
      latitude:         dto.latitude,
      longitude:        dto.longitude,
      locationCity:     dto.locationCity,
      monthlyBillEur:   dto.monthlyBillEur,
      roofAreaSqm:      dto.roofAreaSqm,
      roofAzimuthDegrees: dto.roofAzimuthDegrees,
      roofTiltDegrees:  dto.roofTiltDegrees ?? 30,
      annualKwh,
      roofType:         dto.roofType,
      meterType:        dto.meterType,
      // snapshot
      dataSource:                  calc.dataSource,
      recommendedSystemKw:         calc.recommendedSystemKw,
      estimatedAnnualProductionKwh: calc.estimatedAnnualProductionKwh,
      numberOfPanels:              calc.numberOfPanels,
      estimatedSystemCostEur:      calc.estimatedSystemCostEur,
      estimatedPaybackYears:       calc.estimatedPaybackYears,
      selfSufficiencyPercent:      calc.selfSufficiencyPercent,
      estimatedAnnualSavingsEur:   calc.estimatedAnnualSavingsEur,
      co2SavedTonsPerYear:         calc.co2SavedTonsPerYear,
    });

    const saved = await this.leadRepo.save(lead);

    // Fire-and-forget reverse geocode for GPS leads
    if (dto.latitude && dto.longitude) {
      this.resolveLocationLabel(saved.id, dto.latitude, dto.longitude).catch(() => {});
    }

    return {
      id: saved.id,
      ...calc,
    };
  }

  private async resolveLocationLabel(id: number, lat: number, lon: number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=bs`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      let res: Response;
      try { res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Prosumer.ba/1.0' } }); }
      finally { clearTimeout(timer); }
      if (!res.ok) return;
      const data = await res.json() as any;
      const addr = data?.address;
      if (!addr) return;
      const city    = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '';
      const country = addr.country ?? '';
      const label   = [city, country].filter(Boolean).join(', ');
      if (label) await this.leadRepo.update(id, { locationLabel: label });
    } catch { /* best-effort */ }
  }

  findAll() {
    return this.leadRepo.find({ order: { createdAt: 'DESC' } });
  }
}
