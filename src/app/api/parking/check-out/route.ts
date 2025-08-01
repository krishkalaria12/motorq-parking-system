// app/api/parking/check-out/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';

import dbConnect from '@/db';
import { ParkingSession, ParkingSlot } from '@/models';
import { SessionStatus, SlotStatus, BillingType } from '@/types/enums';
import { calculateBill } from '@/services/pricing-services';

const checkOutSchema = z.object({
  numberPlate: z.string().optional(),
  sessionId: z.string().optional(),
}).refine(data => data.numberPlate || data.sessionId, {
  message: "Either numberPlate or sessionId must be provided.",
});

export async function PUT(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const body = await request.json();

    const validation = checkOutSchema.safeParse(body);
    if (!validation.success) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { numberPlate, sessionId } = validation.data;

    const query = {
      status: SessionStatus.ACTIVE,
      ...(numberPlate && { numberPlate: numberPlate.toUpperCase() }),
      ...(sessionId && { _id: sessionId }),
    };

    // Populate vehicleId to get the vehicleType for billing
    const activeSession = await ParkingSession.findOne(query)
        .populate('vehicleId', 'vehicleType')
        .session(session);

    if (!activeSession) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: "No active session found for this vehicle or session ID." }, { status: 404 });
    }

    // Type guard to ensure vehicleId is populated
    if (!activeSession.vehicleId || typeof activeSession.vehicleId !== 'object') {
        throw new Error("Vehicle details are missing for this session.");
    }

    // Billing
    // For hourly sessions, calculate the final bill now.
    if (activeSession.billingType === BillingType.HOURLY) {
        activeSession.billingAmount = calculateBill(activeSession, (activeSession.vehicleId as any).vehicleType);
    }

    activeSession.status = SessionStatus.COMPLETED;
    activeSession.exitTime = new Date();
    await activeSession.save({ session });

    await ParkingSlot.findByIdAndUpdate(activeSession.slotId, { $set: { status: SlotStatus.AVAILABLE } }, { session });

    await session.commitTransaction();

    return NextResponse.json({ success: true, data: activeSession }, { status: 200 });

  } catch (error) {
    await session.abortTransaction();
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("No active session")) statusCode = 404;
      else if (error.message.includes("Cast to ObjectId failed")) {
        statusCode = 400;
        errorMessage = "Invalid session ID format.";
      }
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: statusCode });
  } finally {
    session.endSession();
  }
}