import { Injectable, Logger } from '@nestjs/common';
import { CalculateSolarDto, SolarCalculationResultDto } from './solar-calculator.dto';
import { PvgisService } from './pvgis.service';

// ─── Fallback: average peak sun hours by latitude band ───────────────────────
// Used when the PVGIS API is unavailable or returns an error.
const PEAK_SUN_HOURS_BY_LATITUDE: { maxLat: number; hours: number }[] = [
  { maxLat: 25, hours: 6.0 },
  { maxLat: 35, hours: 5.5 },
  { maxLat: 45, hours: 4.5 }, // Balkans
  { maxLat: 55, hours: 3.8 },
  { maxLat: 65, hours: 3.2 },
  { maxLat: 90, hours: 2.5 },
];

const STANDARD_PANEL_POWER_W = 400;      // Watts per panel
const STANDARD_PANEL_AREA_SQM = 1.7;    // m² per panel
const SYSTEM_EFFICIENCY = 0.8;           // inverter + wiring losses (matches PVGIS loss=20%)
const ELECTRICITY_PRICE_KM_KWH = 0.29; // prosječna maloprodajna cijena u BiH
const SYSTEM_COST_KM_PER_KW = 2350;    // instalirana cijena po kW
const CO2_KG_PER_KWH = 0.4;            // grid emission factor

@Injectable()
export class SolarCalculatorService {
  private readonly logger = new Logger(SolarCalculatorService.name);

  constructor(private readonly pvgis: PvgisService) {}

  async calculate(dto: CalculateSolarDto): Promise<SolarCalculationResultDto> {
    // ── 1. Get peak sun hours — PVGIS first, fallback second ──────────────────
    let peakSunHours: number;
    let dataSource: 'pvgis' | 'fallback';

    const pvgisData = await this.pvgis.fetchIrradiance(
      dto.latitude,
      dto.longitude,
      dto.roofTiltDegrees,
      dto.roofAzimuthDegrees,
    );

    if (pvgisData) {
      // H(i)_d is kWh/m²/day = peak-sun-hours/day (no further tilt/azimuth correction
      // needed — PVGIS already accounts for those via the angle/aspect params)
      peakSunHours = pvgisData.peakSunHoursPerDay;
      dataSource = 'pvgis';
      this.logger.log(
        `Using PVGIS data: ${peakSunHours} PSH/day for (${dto.latitude}, ${dto.longitude})`,
      );
    } else {
      peakSunHours = this.getFallbackPeakSunHours(
        Math.abs(dto.latitude),
        dto.roofTiltDegrees,
        dto.roofAzimuthDegrees,
      );
      dataSource = 'fallback';
      this.logger.log(
        `Using fallback data: ${peakSunHours} PSH/day for lat ${dto.latitude}`,
      );
    }

    // ── 2. System sizing ──────────────────────────────────────────────────────
    const maxPanelsByArea = Math.floor(dto.roofAreaSqm / STANDARD_PANEL_AREA_SQM);

    const dailyKwh = dto.annualKwh / 365;
    const panelsNeededForDemand = Math.ceil(
      dailyKwh / ((STANDARD_PANEL_POWER_W / 1000) * peakSunHours * SYSTEM_EFFICIENCY),
    );

    const numberOfPanels = Math.min(maxPanelsByArea, panelsNeededForDemand);
    const systemKw = (numberOfPanels * STANDARD_PANEL_POWER_W) / 1000;
    const roofAreaUsed = numberOfPanels * STANDARD_PANEL_AREA_SQM;

    // ── 3. Financial & environmental outputs ─────────────────────────────────
    const annualProductionKwh = systemKw * peakSunHours * 365 * SYSTEM_EFFICIENCY;
    const selfSufficiency = Math.min(100, (annualProductionKwh / dto.annualKwh) * 100);
    const annualSavings = Math.min(annualProductionKwh, dto.annualKwh) * ELECTRICITY_PRICE_KM_KWH;
    const systemCost = systemKw * SYSTEM_COST_KM_PER_KW;
    const paybackYears = annualSavings > 0 ? systemCost / annualSavings : 0;
    const co2Saved = annualProductionKwh * CO2_KG_PER_KWH;

    const batteryRecommendation =
      systemKw > 8
        ? '10 kWh baterija (preporučeno)'
        : systemKw > 4
          ? '5 kWh baterija (opcionalno)'
          : 'Bez baterije';

    return {
      dataSource,
      recommendedSystemKw: Math.round(systemKw * 100) / 100,
      estimatedAnnualProductionKwh: Math.round(annualProductionKwh),
      numberOfPanels,
      roofCoveragePercent: Math.round((roofAreaUsed / dto.roofAreaSqm) * 100),
      selfSufficiencyPercent: Math.round(selfSufficiency * 10) / 10,
      estimatedAnnualSavingsKm: Math.round(annualSavings),
      estimatedMonthlySavingsKm: Math.round(annualSavings / 12),
      estimatedPaybackYears: Math.round(paybackYears * 10) / 10,
      estimatedSystemCostKm: Math.round(systemCost),
      peakSunHoursPerDay: peakSunHours,
      co2SavedKgPerYear: Math.round(co2Saved),
      co2SavedTonsPerYear: Math.round((co2Saved / 1000) * 10) / 10,
      batteryRecommendation,
    };
  }

  // ── Fallback: latitude-band model with tilt/azimuth correction ──────────────
  private getFallbackPeakSunHours(
    absLat: number,
    tiltDeg?: number,
    azimuthDeg?: number,
  ): number {
    const base =
      PEAK_SUN_HOURS_BY_LATITUDE.find((b) => absLat <= b.maxLat)?.hours ?? 2.5;

    const tilt = tiltDeg ?? 30;
    const optimalTilt = absLat;
    const tiltFactor = 1 - Math.abs(tilt - optimalTilt) * 0.003;

    const azimuth = azimuthDeg ?? 0;
    const azimuthFactor = 1 - Math.abs(azimuth) * 0.0015;

    return Math.round(base * tiltFactor * azimuthFactor * 100) / 100;
  }
}
