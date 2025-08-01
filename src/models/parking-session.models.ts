// models/ParkingSession.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SessionStatus, BillingType } from '../types/enums';
import { IParkingSlot } from './parking-slot.models';

// Interface for ParkingSession document
export interface IParkingSession extends Document {
  sessionId: string;
  vehicleId: Types.ObjectId;
  slotId: Types.ObjectId | IParkingSlot; // Allow population
  numberPlate: string;
  entryTime: Date;
  exitTime?: Date;
  status: SessionStatus;
  billingType: BillingType;
  billingAmount: number;
  paidAmount?: number;
  duration?: number; // in minutes
  dayPassDate?: Date;
  overstayNotified?: boolean;
  operatorId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Parking Session Schema
const ParkingSessionSchema = new Schema<IParkingSession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `SES_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  slotId: { type: Schema.Types.ObjectId, ref: 'ParkingSlot', required: true },
  numberPlate: { type: String, required: true, trim: true, uppercase: true, index: true },
  entryTime: { type: Date, default: Date.now, required: true },
  exitTime: {
    type: Date,
    validate: {
      validator: function(this: IParkingSession, exitTime: Date) { return !exitTime || exitTime >= this.entryTime; },
      message: 'Exit time must be after entry time'
    }
  },
  status: { type: String, enum: Object.values(SessionStatus), default: SessionStatus.ACTIVE },
  billingType: { type: String, enum: Object.values(BillingType), required: true },
  billingAmount: { type: Number, default: 0, min: 0 },
  paidAmount: {
    type: Number, min: 0,
    validate: {
      validator: function(this: IParkingSession, paidAmount: number) { return !paidAmount || paidAmount >= this.billingAmount; },
      message: 'Paid amount cannot be less than billing amount'
    }
  },
  duration: { type: Number, min: 0 }, // in minutes
  dayPassDate: {
    type: Date,
    required: function(this: IParkingSession) { return this.billingType === BillingType.DAY_PASS; }
  },
  overstayNotified: { type: Boolean, default: false },
  operatorId: { type: String, trim: true },
  notes: { type: String, trim: true, maxlength: 500 }
}, {
  timestamps: true,
  collection: 'parking_sessions'
});

// Indexes for performance
ParkingSessionSchema.index({ status: 1, entryTime: -1 });
ParkingSessionSchema.index({ slotId: 1, status: 1 });

// Virtual for formatted duration
ParkingSessionSchema.virtual('formattedDuration').get(function(this: IParkingSession) {
  if (!this.duration) return '0 mins';
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  if (hours === 0) return `${minutes} mins`;
  return `${hours}h ${minutes}m`;
});

// Pre-save middleware
ParkingSessionSchema.pre<IParkingSession>('save', function(next) {
  if (this.isModified('numberPlate') && this.numberPlate) {
    this.numberPlate = this.numberPlate.toUpperCase().trim();
  }
  if (this.isModified('exitTime') && this.exitTime) {
    const durationInMinutes = Math.ceil((this.exitTime.getTime() - this.entryTime.getTime()) / (1000 * 60));
    this.duration = durationInMinutes;
  }
  next();
});

// Create and export the model
const ParkingSession = (mongoose.models.ParkingSession as Model<IParkingSession>) || mongoose.model<IParkingSession>('ParkingSession', ParkingSessionSchema);
export default ParkingSession;