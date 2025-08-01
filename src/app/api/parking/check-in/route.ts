// app/api/parking/check-in/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import dbConnect from '@/db';
import { Vehicle, ParkingSession, ParkingSlot } from '@/models';
import { BillingType, SessionStatus, SlotStatus, SlotType, VehicleType } from '@/types/enums';
import { z } from 'zod';
import mongoose from 'mongoose';

// Zod schema for input validation
const checkInSchema = z.object({
  numberPlate: z.string().min(3, "Number plate is required.").max(10).transform(val => val.toUpperCase()),
  vehicleType: z.nativeEnum(VehicleType, { message: "Please select a valid vehicle type." }),
  billingType: z.nativeEnum(BillingType, { message: "Please select a valid billing type." }),
  slotId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const body = await request.json();
    
    const validation = checkInSchema.safeParse(body);
    if (!validation.success) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { numberPlate, vehicleType, billingType, slotId } = validation.data;

    const existingActiveSession = await ParkingSession.findOne({ numberPlate, status: SessionStatus.ACTIVE }).session(session);
    if (existingActiveSession) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: `Vehicle ${numberPlate} already has an active session.` }, { status: 409 });
    }

    let vehicle = await Vehicle.findOne({ numberPlate }).session(session);
    if (!vehicle) {
      vehicle = new Vehicle({ numberPlate, vehicleType });
      await vehicle.save({ session });
    }

    // --- SIMPLIFIED NEAREST SLOT LOGIC ---
    let assignedSlot;
    if (slotId) { // Manual override logic remains the same
      assignedSlot = await ParkingSlot.findById(slotId).session(session);
      if (!assignedSlot || assignedSlot.status !== SlotStatus.AVAILABLE) {
        await session.abortTransaction();
        return NextResponse.json({ success: false, error: "Manually selected slot is not available." }, { status: 409 });
      }
    } else { // Auto-assignment using find and a custom sort
      const compatibleSlotTypes = getCompatibleSlotTypes(vehicleType);
      
      // 1. Find all matching available slots from the database
      const availableSlots = await ParkingSlot.find({
        status: SlotStatus.AVAILABLE,
        slotType: { $in: compatibleSlotTypes },
      }).session(session);

      if (availableSlots.length > 0) {
        // 2. Sort the results in our code to find the "nearest" one
        availableSlots.sort((a, b) => {
          const [floorA, numAStr] = a.slotNumber.split('-');
          const [floorB, numBStr] = b.slotNumber.split('-');

          // compare by floor (e.g., 'B1' vs 'G')
          const floorComparison = floorA.localeCompare(floorB);
          if (floorComparison !== 0) {
            return floorComparison;
          }

          // If floors are the same, compare the numeric part of the slot
          const numA = parseInt(numAStr, 10);
          const numB = parseInt(numBStr, 10);
          return numA - numB;
        });

        // 3. The first slot in the sorted array is our nearest available slot
        assignedSlot = availableSlots[0];
      } else {
        assignedSlot = null;
      }
    }

    if (!assignedSlot) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: "No available parking slots for this vehicle type." }, { status: 409 });
    }

    const sessionData: any = {
      numberPlate, vehicleId: vehicle._id, slotId: assignedSlot._id, billingType, entryTime: new Date(),
    };

    if (billingType === BillingType.DAY_PASS) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      sessionData.dayPassDate = today;
    }

    const newSession = new ParkingSession(sessionData);
    await newSession.save({ session });

    assignedSlot.status = SlotStatus.OCCUPIED;
    await assignedSlot.save({ session });

    await session.commitTransaction();

    return NextResponse.json({ success: true, data: { session: newSession, slot: assignedSlot.slotNumber } }, { status: 201 });

  } catch (error) {
    await session.abortTransaction();
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
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