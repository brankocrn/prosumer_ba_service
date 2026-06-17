import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateSolarDto {
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

  @ApiPropertyOptional({ description: 'Roof azimuth angle in degrees from south (default 0 = south)', example: 0 })
  @IsNumber()
  @IsOptional()
  roofAzimuthDegrees?: number;
}

export class SolarCalculationResultDto {
  /** 'pvgis' when live PVGIS data was used, 'fallback' when the API was unavailable */
  dataSource: 'pvgis' | 'fallback';
  recommendedSystemKw: number;
  estimatedAnnualProductionKwh: number;
  numberOfPanels: number;
  roofCoveragePercent: number;
  selfSufficiencyPercent: number;
  estimatedAnnualSavingsKm: number;
  estimatedMonthlySavingsKm: number;
  estimatedPaybackYears: number;
  estimatedSystemCostKm: number;
  peakSunHoursPerDay: number;
  co2SavedKgPerYear: number;
  co2SavedTonsPerYear: number;
  batteryRecommendation: string;
}
