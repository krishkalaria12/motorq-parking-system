// models/PricingConfig.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { VehicleType, BillingType, PricingRounding } from '../types/enums';

export interface HourlySlabConfig {
  minHours: number;
  maxHours: number;
  price: number;
}

// Interface for PricingConfig document
export interface IPricingConfig extends Document {
  configId: string;
  vehicleType: VehicleType;
  billingType: BillingType;
  isActive: boolean;
  hourlySlabs?: HourlySlabConfig[];
  dayPassPrice?: number;
  partialHourRounding: PricingRounding;
  maxDailyCharge?: number;
  overstayThreshold?: number; // in hours
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Pricing Config Schema
const PricingConfigSchema = new Schema<IPricingConfig>({
  configId: { type: String, required: true, unique: true, default: () => `PRICE_${Date.now()}` },
  vehicleType: { type: String, enum: Object.values(VehicleType), required: true },
  billingType: { type: String, enum: Object.values(BillingType), required: true },
  isActive: { type: Boolean, default: true },
  hourlySlabs: {
    type: [{
      minHours: { type: Number, required: true, min: 0 },
      maxHours: { type: Number, required: true, min: 0 },
      price: { type: Number, required: true, min: 0 }
    }],
    required: function(this: IPricingConfig) { return this.billingType === BillingType.HOURLY; }
  },
  dayPassPrice: {
    type: Number, min: 0,
    required: function(this: IPricingConfig) { return this.billingType === BillingType.DAY_PASS; }
  },
  partialHourRounding: { type: String, enum: Object.values(PricingRounding), default: PricingRounding.UP },
  maxDailyCharge: { type: Number, min: 0 },
  overstayThreshold: { type: Number, min: 1, default: 6 },
  effectiveFrom: { type: Date, default: Date.now, required: true },
  effectiveTo: { type: Date }
}, {
  timestamps: true,
  collection: 'pricing_configs'
});

// Indexes for performance
PricingConfigSchema.index({ vehicleType: 1, billingType: 1, isActive: 1, effectiveFrom: -1 });

// Create and export the model
const PricingConfig = (mongoose.models.PricingConfig as Model<IPricingConfig>) || mongoose.model<IPricingConfig>('PricingConfig', PricingConfigSchema);
export default PricingConfig;