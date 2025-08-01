// app/api/parking/check-out/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';

import dbConnect from '@/db';
import { ParkingSession, ParkingSlot } from '@/models';
import { SessionStatus, SlotStatus } from '@/types/enums';

const checkOutSchema = z.object({
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
      await session.abortTransaction();
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { numberPlate, sessionId } = validation.data;

    // Build query to find active session
    const query = {
      status: SessionStatus.ACTIVE,
      ...(numberPlate && { numberPlate: numberPlate.toUpperCase() }),
      ...(sessionId && { _id: sessionId }),
    };

    const activeSession = await ParkingSession.findOne(query).session(session);

    if (!activeSession) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          success: false,
          error: "No active session found for this vehicle or session ID.",
        },
        { status: 404 }
      );
    }

    // Mark session as completed
    activeSession.status = SessionStatus.COMPLETED;
    activeSession.exitTime = new Date();
    await activeSession.save({ session });

    // Free up the parking slot
    await ParkingSlot.findByIdAndUpdate(
      activeSession.slotId,
      { $set: { status: SlotStatus.AVAILABLE } },
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json(
      { 
        success: true, 
        data: activeSession 
      }, 
      { status: 200 }
    );

  } catch (error) {
    await session.abortTransaction();

    // Enhanced error handling
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes("No active session")) {
        statusCode = 404;
      } else if (error.message.includes("Cast to ObjectId failed")) {
        statusCode = 400;
        errorMessage = "Invalid session ID format.";
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
