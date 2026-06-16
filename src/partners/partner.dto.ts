import {
  IsString, IsEmail, IsOptional, IsBoolean,
  IsNumber, IsArray, IsIn, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartnerDto {
  @ApiProperty({ example: 'SunTech BH' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'info@suntech.ba' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+387 36 000 000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Bulevar 12, Mostar' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'https://suntech.ba' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: 'Mostar', description: 'City where the partner operates' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'BiH', description: 'Country code: BiH or HR' })
  @IsString()
  @IsIn(['BiH', 'HR'])
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Specijalisti za rezidencijalne sustave do 15 kWp.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 4.9, description: 'Rating 0–5' })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ example: 87, description: 'Number of completed projects' })
  @IsNumber()
  @IsOptional()
  projectCount?: number;

  @ApiPropertyOptional({ example: 'Premium', description: 'Badge tier: Premium or Verified' })
  @IsString()
  @IsIn(['Premium', 'Verified'])
  @IsOptional()
  badge?: string;

  @ApiPropertyOptional({ example: ['JA Solar', 'Huawei', 'Baterije'], description: 'Brand/skill tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Latitude', example: 43.3438 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: 17.8078 })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class UpdatePartnerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'BiH' })
  @IsString()
  @IsIn(['BiH', 'HR'])
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 4.9 })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  projectCount?: number;

  @ApiPropertyOptional({ example: 'Premium' })
  @IsString()
  @IsIn(['Premium', 'Verified'])
  @IsOptional()
  badge?: string;

  @ApiPropertyOptional({ example: ['JA Solar', 'Huawei'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
