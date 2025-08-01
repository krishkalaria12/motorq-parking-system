import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import dbConnect from '@/db';
import { ParkingSession } from '@/models';
import { SessionStatus } from '@/types/enums';

const OVERSTAY_THRESHOLD_HOURS = 6;

export async function GET() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();

    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - OVERSTAY_THRESHOLD_HOURS);

    const sessionsToFlag = await ParkingSession.find({
      status: SessionStatus.ACTIVE,
      entryTime: { $lt: thresholdTime },
      overstayNotified: false,
    }).session(session);

    if (sessionsToFlag.length === 0) {
      await session.commitTransaction();
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const sessionIdsToUpdate = sessionsToFlag.map(s => s._id);

    await ParkingSession.updateMany(
      { _id: { $in: sessionIdsToUpdate } },
      { 
        $set: { 
          status: SessionStatus.OVERSTAY, 
          overstayNotified: true 
        } 
      },
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({ success: true, data: sessionsToFlag }, { status: 200 });

  } catch (error) {
    await session.abortTransaction();
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    session.endSession();
  }
}