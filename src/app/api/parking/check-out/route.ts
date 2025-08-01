// app/api/parking/check-out/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';

import dbConnect from '@/db';
import { ParkingSession, ParkingSlot } from '@/models';
import { SessionStatus, SlotStatus } from '@/types/enums';

const checkOutSchema = z.object({
  // Can check-out by number plate or session ID
  numberPlate: z.string().optional(),
  sessionId: z.string().optional(),
}).refine(data => data.numberPlate || data.sessionId, {
  message: "Either numberPlate or sessionId must be provided.",
});

/**
 * @description Handle vehicle check-out.
 * Completes the session and frees the parking slot.
 */
export async function PUT(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate input
    const validation = checkOutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { numberPlate, sessionId } = validation.data;

    // 1. Find the active session
    const query = {
      status: SessionStatus.ACTIVE,
      ...(numberPlate && { numberPlate: numberPlate.toUpperCase() }),
      ...(sessionId && { _id: sessionId }),
    };
    
    const activeSession = await ParkingSession.findOne(query).session(session);

    if (!activeSession) {
      throw new Error("No active session found for this vehicle.");
    }

    // 2. Mark session as completed
    activeSession.status = SessionStatus.COMPLETED;
    activeSession.exitTime = new Date();
    await activeSession.save({ session });

    // 3. Free up the parking slot
    await ParkingSlot.findByIdAndUpdate(
      activeSession.slotId,
      { $set: { status: SlotStatus.AVAILABLE } },
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({ success: true, data: activeSession }, { status: 200 });

  } catch (error) {
    await session.abortTransaction();
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 404 });
  } finally {
    session.endSession();
  }
}