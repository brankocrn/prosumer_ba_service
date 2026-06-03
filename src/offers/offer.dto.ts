import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus } from './offer.entity';

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  partnerId: number;

  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  warrantyYears?: number;

  @ApiPropertyOptional({ enum: OfferStatus })
  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validUntil?: Date;
}

export class UpdateOfferDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

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
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  warrantyYears?: number;

  @ApiPropertyOptional({ enum: OfferStatus })
  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validUntil?: Date;
}
