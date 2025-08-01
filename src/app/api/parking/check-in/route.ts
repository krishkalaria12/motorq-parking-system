// app/api/parking/check-in/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/db';
import { Vehicle, ParkingSession, ParkingSlot } from '@/models';
import { BillingType, SessionStatus, SlotStatus, SlotType, VehicleType } from '@/types/enums';
import { z } from 'zod';
import mongoose from 'mongoose';

// Zod schema for input validation
const checkInSchema = z.object({
  numberPlate: z.string().min(3, "Number plate must be at least 3 characters.").max(10, "Number plate must be no more than 10 characters.").transform(val => val.toUpperCase()),
  vehicleType: z.nativeEnum(VehicleType, {
    message: "Please select a valid vehicle type."
  }),
  billingType: z.nativeEnum(BillingType, {
    message: "Please select a valid billing type."
  }),
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
      await session.abortTransaction();
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const { numberPlate, vehicleType, billingType, slotId } = validation.data;

    // Check for existing active session
    const existingActiveSession = await ParkingSession.findOne({ 
      numberPlate, 
      status: SessionStatus.ACTIVE 
    }).session(session);

    if (existingActiveSession) {
      await session.abortTransaction();
      return NextResponse.json(
        { 
          success: false, 
          error: `Vehicle ${numberPlate} already has an active session.` 
        }, 
        { status: 409 }
      );
    }

    // Find or create vehicle
    let vehicle = await Vehicle.findOne({ numberPlate }).session(session);
    if (!vehicle) {
      vehicle = new Vehicle({ numberPlate, vehicleType });
      await vehicle.save({ session });
    }

    // Find available slot
    let assignedSlot;
    if (slotId) {
      assignedSlot = await ParkingSlot.findById(slotId).session(session);
      if (!assignedSlot || assignedSlot.status !== SlotStatus.AVAILABLE) {
        await session.abortTransaction();
        return NextResponse.json(
          { 
            success: false, 
            error: "Manually selected slot is not available." 
          }, 
          { status: 409 }
        );
      }
    } else {
      const compatibleSlotTypes = getCompatibleSlotTypes(vehicleType);
      assignedSlot = await ParkingSlot.findOne({
        status: SlotStatus.AVAILABLE,
        slotType: { $in: compatibleSlotTypes },
      }).sort({ floor: 1, slotNumber: 1 }).session(session);
    }

    if (!assignedSlot) {
      await session.abortTransaction();
      return NextResponse.json(
        { 
          success: false, 
          error: "No available parking slots for this vehicle type." 
        }, 
        { status: 409 }
      );
    }

    // Prepare session data
    const sessionData: any = {
      numberPlate,
      vehicleId: vehicle._id,
      slotId: assignedSlot._id,
      billingType,
      entryTime: new Date(),
    };

    if (billingType === BillingType.DAY_PASS) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      sessionData.dayPassDate = today;
    }

    // Create parking session
    const newSession = new ParkingSession(sessionData);
    await newSession.save({ session });

    // Update slot status
    assignedSlot.status = SlotStatus.OCCUPIED;
    await assignedSlot.save({ session });

    await session.commitTransaction();

    return NextResponse.json(
      { 
        success: true, 
        data: { 
          session: newSession, 
          slot: assignedSlot.slotNumber 
        } 
      }, 
      { status: 201 }
    );

  } catch (error) {
    await session.abortTransaction();
    
    // Handle different types of errors
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // You can add more specific error handling here based on error types
      if (error.message.includes('duplicate key')) {
        statusCode = 409;
        errorMessage = 'This record already exists';
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      }, 
      { status: statusCode }
    );
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