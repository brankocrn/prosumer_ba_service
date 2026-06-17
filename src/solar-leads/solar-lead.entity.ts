import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum RoofType {
  FLAT       = 'flat',
  TILE       = 'tile',
  SHEET_METAL = 'sheet_metal',
}

export enum MeterType {
  SINGLE_PHASE = 'single_phase',
  THREE_PHASE  = 'three_phase',
}

export enum LeadStatus {
  NEW       = 'new',
  CONTACTED = 'contacted',
  CLOSED    = 'closed',
}

@Entity('solar_leads')
export class SolarLead {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Contact ────────────────────────────────────────────────────────────────
  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  // ── Location ───────────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude: number;

  @Column({ length: 100, nullable: true, comment: 'City name when GPS was unavailable' })
  locationCity: string;

  @Column({ length: 255, nullable: true, comment: 'Human-readable label from reverse geocoding (e.g. Sarajevo, Bosnia and Herzegovina)' })
  locationLabel: string;

  // ── Calculator inputs ──────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  monthlyBillKm: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  roofAreaSqm: number;

  @Column({ type: 'int' })
  roofAzimuthDegrees: number;

  @Column({ type: 'int', default: 30 })
  roofTiltDegrees: number;

  @Column({ type: 'int', comment: 'Derived from monthly bill: monthlyBill * 12 / 0.25' })
  annualKwh: number;

  @Column({
    type: 'enum',
    enum: RoofType,
    nullable: true,
    comment: 'flat | tile | sheet_metal',
  })
  roofType: RoofType;

  @Column({
    type: 'enum',
    enum: MeterType,
    nullable: true,
    comment: 'single_phase | three_phase',
  })
  meterType: MeterType;

  // ── Calculation result snapshot ────────────────────────────────────────────
  @Column({ length: 20, default: 'fallback' })
  dataSource: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  recommendedSystemKw: number;

  @Column({ type: 'int', nullable: true })
  estimatedAnnualProductionKwh: number;

  @Column({ type: 'int', nullable: true })
  numberOfPanels: number;

  @Column({ type: 'int', nullable: true })
  estimatedSystemCostKm: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  estimatedPaybackYears: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  selfSufficiencyPercent: number;

  @Column({ type: 'int', nullable: true })
  estimatedAnnualSavingsKm: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  co2SavedTonsPerYear: number;

  // ── Status ─────────────────────────────────────────────────────────────────
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
