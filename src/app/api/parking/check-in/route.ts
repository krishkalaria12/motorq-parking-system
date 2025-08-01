// app/api/parking/check-in/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/db';
import { Vehicle, ParkingSession, ParkingSlot } from '@/models';
import { BillingType, SessionStatus, SlotStatus, SlotType, VehicleType } from '@/types/enums';
import { z } from 'zod';
import mongoose from 'mongoose';

// Zod schema for input validation
const checkInSchema = z.object({
  numberPlate: z.string().min(3, "Number plate is required.").toUpperCase(),
  vehicleType: z.nativeEnum(VehicleType),
  billingType: z.nativeEnum(BillingType),
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
    
    const validation = checkInSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { numberPlate, vehicleType, billingType, slotId } = validation.data;

    const existingActiveSession = await ParkingSession.findOne({ numberPlate, status: SessionStatus.ACTIVE }).session(session);
    if (existingActiveSession) {
      throw new Error(`Vehicle ${numberPlate} already has an active session.`);
    }

    let vehicle = await Vehicle.findOne({ numberPlate }).session(session);
    if (!vehicle) {
      vehicle = new Vehicle({ numberPlate, vehicleType });
      await vehicle.save({ session });
    }

    let assignedSlot;
    if (slotId) {
      assignedSlot = await ParkingSlot.findById(slotId).session(session);
      if (!assignedSlot || assignedSlot.status !== SlotStatus.AVAILABLE) {
        throw new Error("Manually selected slot is not available.");
      }
    } else {
      const compatibleSlotTypes = getCompatibleSlotTypes(vehicleType);
      assignedSlot = await ParkingSlot.findOne({
        status: SlotStatus.AVAILABLE,
        slotType: { $in: compatibleSlotTypes },
      }).sort({ floor: 1, slotNumber: 1 }).session(session);
    }
    
    if (!assignedSlot) {
      throw new Error("No available parking slots for this vehicle type.");
    }

    // --- FIX: Conditionally add dayPassDate ---
    const sessionData: any = {
      numberPlate,
      vehicleId: vehicle._id,
      slotId: assignedSlot._id,
      billingType,
      entryTime: new Date(),
    };

    if (billingType === BillingType.DAY_PASS) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to the beginning of the day
      sessionData.dayPassDate = today;
    }
    // --- End of FIX ---

    // Create the new parking session with the complete data
    const newSession = new ParkingSession(sessionData);
    await newSession.save({ session });

    assignedSlot.status = SlotStatus.OCCUPIED;
    await assignedSlot.save({ session });

    await session.commitTransaction();

    return NextResponse.json({ success: true, data: { session: newSession, slot: assignedSlot.slotNumber } }, { status: 201 });

  } catch (error) {
    await session.abortTransaction();
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 409 });
  } finally {
    session.endSession();
  }
}

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