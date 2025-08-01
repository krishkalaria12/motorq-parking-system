import { BillingType, VehicleType } from '@/types/enums';
import { IParkingSession } from '@/models/parking-session.models';

const HOURLY_RATE_SLABS = {
  DEFAULT: [
    { minHours: 0, maxHours: 1, price: 50 },
    { minHours: 1, maxHours: 3, price: 100 },
    { minHours: 3, maxHours: 6, price: 150 },
    { minHours: 6, maxHours: 24, price: 200 },
  ],
  BIKE: [
    { minHours: 0, maxHours: 1, price: 20 },
    { minHours: 1, maxHours: 4, price: 40 },
    { minHours: 4, maxHours: 8, price: 60 },
    { minHours: 8, maxHours: 24, price: 80 },
  ],
};

const DAY_PASS_RATES = {
  DEFAULT: 150,
  BIKE: 75,
};


// Calculates the final bill for a given parking session.
export function calculateBill(session: IParkingSession, vehicleType: VehicleType): number {
  // For Day Pass, the fee is fixed.
  if (session.billingType === BillingType.DAY_PASS) {
    return vehicleType === VehicleType.BIKE ? DAY_PASS_RATES.BIKE : DAY_PASS_RATES.DEFAULT;
  }

  // For Hourly, calculate based on duration.
  if (session.billingType === BillingType.HOURLY) {
    const entryTime = new Date(session.entryTime);
    // Use the session's exitTime if it exists, otherwise calculate up to the current time.
    const exitTime = session.exitTime ? new Date(session.exitTime) : new Date();
    
    const durationInMillis = exitTime.getTime() - entryTime.getTime();
    // Round up to the nearest hour as per standard parking rules.
    const durationInHours = Math.ceil(durationInMillis / (1000 * 60 * 60));

    const rateSlabs = vehicleType === VehicleType.BIKE ? HOURLY_RATE_SLABS.BIKE : HOURLY_RATE_SLABS.DEFAULT;

    // Find the correct pricing slab for the calculated duration.
    for (const slab of rateSlabs) {
      if (durationInHours > slab.minHours && durationInHours <= slab.maxHours) {
        return slab.price;
      }
    }

    // If duration exceeds all defined slabs (e.g., > 24 hours), apply the max charge.
    return rateSlabs[rateSlabs.length - 1].price;
  }
  
  return 0;
}