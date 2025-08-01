// types/enums.ts

export enum VehicleType {
  CAR = 'CAR',
  BIKE = 'BIKE',
  EV = 'EV',
  HANDICAP_ACCESSIBLE = 'HANDICAP_ACCESSIBLE'
}

export enum SlotType {
  REGULAR = 'REGULAR',
  COMPACT = 'COMPACT',
  EV = 'EV',
  BIKE = 'BIKE',
  HANDICAP_ACCESSIBLE = 'HANDICAP_ACCESSIBLE'
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE'
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  OVERSTAY = 'OVERSTAY'
}

export enum BillingType {
  HOURLY = 'HOURLY',
  DAY_PASS = 'DAY_PASS'
}

export enum PricingRounding {
  UP = 'UP',
  DOWN = 'DOWN',
  NEAREST = 'NEAREST'
}

// Common interfaces
export interface HourlySlabConfig {
  minHours: number;
  maxHours: number;
  price: number;
}

export interface SlotUtilizationData {
  slotType: SlotType;
  totalSlots: number;
  occupiedHours: number;
  utilizationPercentage: number;
}