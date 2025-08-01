// models/RevenueReport.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface SlotUtilizationData {
  slotType: string;
  totalSlots: number;
  occupiedHours: number;
  utilizationPercentage: number;
}

// Interface for RevenueReport document
export interface IRevenueReport extends Document {
  reportId: string;
  date: Date;
  totalRevenue: number;
  hourlyRevenue: number;
  dayPassRevenue: number;
  totalSessions: number;
  avgSessionDuration: number; // in minutes
  peakHour: string;
  slotUtilization: SlotUtilizationData[];
  createdAt: Date;
  updatedAt: Date;
}

// Revenue Report Schema
const RevenueReportSchema = new Schema<IRevenueReport>({
  reportId: { type: String, required: true, unique: true, default: () => `RPT_${Date.now()}` },
  date: { type: Date, required: true, unique: true, index: true },
  totalRevenue: { type: Number, required: true, min: 0, default: 0 },
  hourlyRevenue: { type: Number, required: true, min: 0, default: 0 },
  dayPassRevenue: { type: Number, required: true, min: 0, default: 0 },
  totalSessions: { type: Number, required: true, min: 0, default: 0 },
  avgSessionDuration: { type: Number, min: 0, default: 0 },
  peakHour: { type: String, default: 'N/A' },
  slotUtilization: [{
    slotType: { type: String, required: true },
    totalSlots: { type: Number, required: true, min: 0 },
    occupiedHours: { type: Number, required: true, min: 0 },
    utilizationPercentage: { type: Number, required: true, min: 0, max: 100 }
  }]
}, {
  timestamps: true,
  collection: 'revenue_reports'
});

// Create and export the model
const RevenueReport = (mongoose.models.RevenueReport as Model<IRevenueReport>) || mongoose.model<IRevenueReport>('RevenueReport', RevenueReportSchema);
export default RevenueReport;