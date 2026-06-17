import {
  IsString, IsEmail, IsOptional, IsNumber,
  IsEnum, Min, Max, IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoofType, MeterType } from './solar-lead.entity';

export class CreateSolarLeadDto {
  // ── Contact ────────────────────────────────────────────────────────────────
  @ApiProperty({ example: 'Marko Marković' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'marko@email.ba' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+387 61 000 000' })
  @IsString()
  @IsOptional()
  phone?: string;

  // ── Location ───────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 43.85 })
  @IsNumber()
  @Min(-90) @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 18.41 })
  @IsNumber()
  @Min(-180) @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Sarajevo', description: 'City name when GPS unavailable' })
  @IsString()
  @IsOptional()
  locationCity?: string;

  // ── Calculator inputs ──────────────────────────────────────────────────────
  @ApiProperty({ example: 120, description: 'Mjesečni račun za struju u KM' })
  @IsNumber()
  @Min(1)
  monthlyBillKm: number;

  @ApiProperty({ example: 40, description: 'Available roof area in m²' })
  @IsNumber()
  @Min(1)
  roofAreaSqm: number;

  @ApiProperty({ example: 0, description: 'Roof azimuth degrees from south (0=south, 90=west, -90=east)' })
  @IsInt()
  roofAzimuthDegrees: number;

  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @IsOptional()
  roofTiltDegrees?: number;

  @ApiPropertyOptional({ enum: RoofType, example: RoofType.TILE })
  @IsEnum(RoofType)
  @IsOptional()
  roofType?: RoofType;

  @ApiPropertyOptional({ enum: MeterType, example: MeterType.SINGLE_PHASE })
  @IsEnum(MeterType)
  @IsOptional()
  meterType?: MeterType;
}

export class SolarLeadResponseDto {
  id: number;
  // Calculation result echoed back so frontend can display it immediately
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
