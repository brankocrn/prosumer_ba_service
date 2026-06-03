import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateSolarOffersDto {
  @ApiProperty({ description: 'Latitude of the property', example: 44.8125 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude of the property', example: 20.4612 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ description: 'Available rooftop area in square meters', example: 40 })
  @IsNumber()
  @Min(1)
  roofAreaSqm: number;

  @ApiProperty({ description: 'Annual electricity consumption in kWh', example: 4500 })
  @IsNumber()
  @Min(1)
  annualKwh: number;

  @ApiPropertyOptional({ description: 'Roof tilt angle in degrees (default 30)', example: 30 })
  @IsNumber()
  @IsOptional()
  roofTiltDegrees?: number;

  @ApiPropertyOptional({ description: 'Roof azimuth degrees from south (0 = south)', example: 0 })
  @IsNumber()
  @IsOptional()
  roofAzimuthDegrees?: number;
}

// ─── Response shapes ───────────────────────────────────────────────────────────

export class ProductLineDto {
  productId: number;
  productName: string;
  manufacturer: string;
  model: string;
  unitPriceEur: number;
  quantity: number;
  subtotalEur: number;
  specs: Record<string, string | number>;
}

export class SolarOfferDto {
  partnerId: number;
  partnerName: string;
  partnerAddress: string;
  partnerPhone: string;
  partnerEmail: string;
  distanceKm: number;

  // System summary
  systemKw: number;
  numberOfPanels: number;
  estimatedAnnualProductionKwh: number;
  selfSufficiencyPercent: number;
  co2SavedKgPerYear: number;

  // Line items
  panels: ProductLineDto;
  inverter: ProductLineDto | null;
  mounting: ProductLineDto | null;
  additionalProducts: ProductLineDto[];

  // Totals
  subtotalEquipmentEur: number;
  estimatedInstallationEur: number;
  totalEur: number;
  estimatedAnnualSavingsEur: number;
  estimatedPaybackYears: number;
}

export class GenerateSolarOffersResponseDto {
  calculation: {
    recommendedSystemKw: number;
    numberOfPanels: number;
    estimatedAnnualProductionKwh: number;
    selfSufficiencyPercent: number;
    peakSunHoursPerDay: number;
    co2SavedKgPerYear: number;
    estimatedAnnualSavingsEur: number;
    estimatedPaybackYears: number;
  };
  offers: SolarOfferDto[];
}
