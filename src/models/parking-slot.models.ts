// models/ParkingSlot.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { SlotType, SlotStatus } from '../types/enums';

// Interface for the ParkingSlot document
export interface IParkingSlot extends Document {
  slotId: string;
  slotNumber: string; // e.g., "B1-12"
  floor: string; // e.g., "B1"
  slotType: SlotType;
  status: SlotStatus;
  hasCharger?: boolean;
  isAccessible?: boolean;
  maintenanceReason?: string;
  maintenanceStartTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Parking Slot Schema
const ParkingSlotSchema = new Schema<IParkingSlot>({
  slotId: {
    type: String,
    required: true,
    unique: true,
    default: () => `SLOT_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`
  },
  slotNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: (v: string) => /^[A-Z0-9]+[-][A-Z0-9]+$/.test(v),
      message: 'Slot number must follow format: FLOOR-NUMBER (e.g., B1-12)'
    }
  },
  floor: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  slotType: {
    type: String,
    enum: Object.values(SlotType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(SlotStatus),
    default: SlotStatus.AVAILABLE
  },
  hasCharger: {
    type: Boolean,
    default: function() {
      // `this` refers to the document being created
      return (this as IParkingSlot).slotType === SlotType.EV;
    }
  },
  isAccessible: {
    type: Boolean,
    default: function() {
      return (this as IParkingSlot).slotType === SlotType.HANDICAP_ACCESSIBLE;
    }
  },
  maintenanceReason: {
    type: String,
    trim: true,
    required: function() {
      return (this as IParkingSlot).status === SlotStatus.MAINTENANCE;
    }
  },
  maintenanceStartTime: {
    type: Date,
    default: function() {
      return (this as IParkingSlot).status === SlotStatus.MAINTENANCE ? new Date() : undefined;
    }
  }
}, {
  timestamps: true,
  collection: 'parking_slots'
});

// Indexes for performance
ParkingSlotSchema.index({ status: 1, slotType: 1 });
ParkingSlotSchema.index({ floor: 1, slotNumber: 1 });

// Pre-save middleware to normalize data
ParkingSlotSchema.pre<IParkingSlot>('save', function(next) {
  if (this.isModified('slotNumber')) {
    this.slotNumber = this.slotNumber.toUpperCase().trim();
  }
  if (this.isModified('floor')) {
    this.floor = this.floor.toUpperCase().trim();
  }
  next();
});

// Create and export the model
const ParkingSlot = (mongoose.models.ParkingSlot as Model<IParkingSlot>) || mongoose.model<IParkingSlot>('ParkingSlot', ParkingSlotSchema);

export default ParkingSlot;