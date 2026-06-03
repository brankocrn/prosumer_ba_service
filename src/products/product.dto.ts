import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '../common/entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ description: 'Partner this product belongs to' })
  @IsNumber()
  partnerId: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  powerWatts?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  efficiencyPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  areaSqm?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  powerWatts?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  efficiencyPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  areaSqm?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
