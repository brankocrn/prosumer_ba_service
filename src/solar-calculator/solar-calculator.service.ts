import { Injectable } from '@nestjs/common';
import { CalculateSolarDto, SolarCalculationResultDto } from './solar-calculator.dto';

// Average peak sun hours by latitude band (simplified model)
// In production, integrate with a PVGIS or NASA POWER API call
const PEAK_SUN_HOURS_BY_LATITUDE: { maxLat: number; hours: number }[] = [
  { maxLat: 25, hours: 6.0 },
  { maxLat: 35, hours: 5.5 },
  { maxLat: 45, hours: 4.5 },
  { maxLat: 55, hours: 3.8 },
  { maxLat: 65, hours: 3.2 },
  { maxLat: 90, hours: 2.5 },
];

const STANDARD_PANEL_POWER_W = 400;       // Watts per panel
const STANDARD_PANEL_AREA_SQM = 1.7;     // m² per panel
const SYSTEM_EFFICIENCY = 0.8;            // inverter + wiring losses
const ELECTRICITY_PRICE_EUR_KWH = 0.15;  // average retail price
const SYSTEM_COST_EUR_PER_KW = 1200;     // installed cost
const CO2_KG_PER_KWH = 0.4;             // grid emission factor

@Injectable()
export class SolarCalculatorService {
  calculate(dto: CalculateSolarDto): SolarCalculationResultDto {
    const absLat = Math.abs(dto.latitude);
    const peakSunHours = this.getPeakSunHours(absLat, dto.roofTiltDegrees, dto.roofAzimuthDegrees);

    // Max panels that fit on the roof
    const maxPanelsByArea = Math.floor(dto.roofAreaSqm / STANDARD_PANEL_AREA_SQM);

    // Panels needed to cover annual consumption
    const dailyKwh = dto.annualKwh / 365;
    const panelsNeededForDemand = Math.ceil(
      dailyKwh / ((STANDARD_PANEL_POWER_W / 1000) * peakSunHours * SYSTEM_EFFICIENCY),
    );

    const numberOfPanels = Math.min(maxPanelsByArea, panelsNeededForDemand);
    const systemKw = (numberOfPanels * STANDARD_PANEL_POWER_W) / 1000;
    const roofAreaUsed = numberOfPanels * STANDARD_PANEL_AREA_SQM;

    const annualProductionKwh = systemKw * peakSunHours * 365 * SYSTEM_EFFICIENCY;
    const selfSufficiency = Math.min(100, (annualProductionKwh / dto.annualKwh) * 100);
    const annualSavings = Math.min(annualProductionKwh, dto.annualKwh) * ELECTRICITY_PRICE_EUR_KWH;
    const systemCost = systemKw * SYSTEM_COST_EUR_PER_KW;
    const paybackYears = annualSavings > 0 ? systemCost / annualSavings : 0;
    const co2Saved = annualProductionKwh * CO2_KG_PER_KWH;

    return {
      recommendedSystemKw: Math.round(systemKw * 100) / 100,
      estimatedAnnualProductionKwh: Math.round(annualProductionKwh),
      numberOfPanels,
      roofCoveragePercent: Math.round((roofAreaUsed / dto.roofAreaSqm) * 100),
      selfSufficiencyPercent: Math.round(selfSufficiency * 10) / 10,
      estimatedAnnualSavingsEur: Math.round(annualSavings),
      estimatedPaybackYears: Math.round(paybackYears * 10) / 10,
      peakSunHoursPerDay: peakSunHours,
      co2SavedKgPerYear: Math.round(co2Saved),
    };
  }

  private getPeakSunHours(absLat: number, tiltDeg?: number, azimuthDeg?: number): number {
    const base = PEAK_SUN_HOURS_BY_LATITUDE.find((b) => absLat <= b.maxLat)?.hours ?? 2.5;

    // Simple tilt correction: optimal tilt ≈ latitude, deviation reduces output
    const tilt = tiltDeg ?? 30;
    const optimalTilt = absLat;
    const tiltFactor = 1 - Math.abs(tilt - optimalTilt) * 0.003;

    // Azimuth correction: due south = 0°, east/west = ±90° loses ~15%
    const azimuth = azimuthDeg ?? 0;
    const azimuthFactor = 1 - Math.abs(azimuth) * 0.0015;

    return Math.round(base * tiltFactor * azimuthFactor * 100) / 100;
  }
}
