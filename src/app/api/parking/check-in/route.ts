// app/api/parking/check-in/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';

import dbConnect from '@/db';
import { Vehicle, ParkingSession, ParkingSlot } from '@/models';
import { BillingType, SessionStatus, SlotStatus, SlotType, VehicleType } from '@/types/enums';

// Zod schema for input validation
const checkInSchema = z.object({
  numberPlate: z.string().min(3, "Number plate is required.").toUpperCase(),
  vehicleType: z.enum(VehicleType),
  billingType: z.enum(BillingType),
  // Optional: for manual override
  slotId: z.string().optional(), 
});

/**
 * @description Handle vehicle check-in.
 * Assigns a parking slot and creates an active session.
 */
export async function POST(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate input
    const validation = checkInSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { numberPlate, vehicleType, billingType, slotId } = validation.data;

    // 1. Check if the vehicle already has an active session
    const existingActiveSession = await ParkingSession.findOne({ numberPlate, status: SessionStatus.ACTIVE }).session(session);
    if (existingActiveSession) {
      throw new Error(`Vehicle ${numberPlate} already has an active session.`);
    }

    // 2. Find or create the vehicle record
    let vehicle = await Vehicle.findOne({ numberPlate }).session(session);
    if (!vehicle) {
      vehicle = new Vehicle({ numberPlate, vehicleType });
      await vehicle.save({ session });
    }

    // 3. Find an available slot
    let assignedSlot;
    if (slotId) { // Manual override
      assignedSlot = await ParkingSlot.findById(slotId).session(session);
      if (!assignedSlot || assignedSlot.status !== SlotStatus.AVAILABLE) {
        throw new Error("Manually selected slot is not available.");
      }
    } else { // Auto-assignment
      const compatibleSlotTypes = getCompatibleSlotTypes(vehicleType);
      assignedSlot = await ParkingSlot.findOne({
        status: SlotStatus.AVAILABLE,
        slotType: { $in: compatibleSlotTypes },
      }).sort({ floor: 1, slotNumber: 1 }).session(session);
    }
    
    if (!assignedSlot) {
      throw new Error("No available parking slots for this vehicle type.");
    }

    // 4. Create the new parking session
    const newSession = new ParkingSession({
      numberPlate,
      vehicleId: vehicle._id,
      slotId: assignedSlot._id,
      billingType,
      entryTime: new Date(),
    });
    await newSession.save({ session });

    // 5. Update the slot status to Occupied
    assignedSlot.status = SlotStatus.OCCUPIED;
    await assignedSlot.save({ session });

    // If all operations are successful, commit the transaction
    await session.commitTransaction();

    return NextResponse.json({ success: true, data: { session: newSession, slot: assignedSlot.slotNumber } }, { status: 201 });

  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 409 }); // 409 Conflict is suitable here
  } finally {
    session.endSession();
  }
}

// Helper function to determine compatible slot types
function getCompatibleSlotTypes(vehicleType: VehicleType): SlotType[] {
  switch (vehicleType) {
    case VehicleType.CAR:
      return [SlotType.REGULAR, SlotType.COMPACT];
    case VehicleType.BIKE:
      return [SlotType.BIKE];
    case VehicleType.EV:
      return [SlotType.EV];
    case VehicleType.HANDICAP_ACCESSIBLE:
      return [SlotType.HANDICAP_ACCESSIBLE];
    default:
      return [];
  }
}