// models/Vehicle.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { VehicleType } from '../types/enums';

export interface IVehicle extends Document {
  vehicleId: string;
  numberPlate: string;
  vehicleType: VehicleType;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  vehicleId: {
    type: String,
    required: true,
    unique: true,
    default: () => `VEH_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  },
  numberPlate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true, // A physical vehicle should only be in the DB once
    index: true,
    validate: {
      validator: (v: string) => /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$/.test(v),
      message: 'Invalid Indian number plate format'
    }
  },
  vehicleType: {
    type: String,
    enum: Object.values(VehicleType),
    required: true
  }
}, {
  timestamps: true,
  collection: 'vehicles'
});

// Pre-save middleware to normalize the number plate
VehicleSchema.pre<IVehicle>('save', function(next) {
  if (this.isModified('numberPlate') && this.numberPlate) {
    this.numberPlate = this.numberPlate.toUpperCase().replace(/[\s-]/g, '');
  }
  next();
});

// Create and export the model
const Vehicle = (mongoose.models.Vehicle as Model<IVehicle>) || mongoose.model<IVehicle>('Vehicle', VehicleSchema);
export default Vehicle;