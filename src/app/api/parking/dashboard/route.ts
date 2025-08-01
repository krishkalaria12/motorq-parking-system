// app/api/parking/dashboard/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/db';
import { ParkingSlot, ParkingSession } from '@/models';
import { SessionStatus, SlotStatus } from '@/types/enums';

/**
 * @description Get dashboard stats (slot counts) and active sessions.
 */
export async function GET() {
  try {
    await dbConnect();

    // 1. Get Slot Counts using Aggregation
    const slotCounts = await ParkingSlot.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$status', SlotStatus.AVAILABLE] }, 1, 0] } },
          occupied: { $sum: { $cond: [{ $eq: ['$status', SlotStatus.OCCUPIED] }, 1, 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ['$status', SlotStatus.MAINTENANCE] }, 1, 0] } },
        },
      },
      {
        $project: { _id: 0 } // Exclude the _id field
      }
    ]);
    
    // 2. Get all active sessions, populating related data
    const activeSessions = await ParkingSession.find({ status: SessionStatus.ACTIVE })
      .populate('vehicleId', 'numberPlate vehicleType')
      .populate('slotId', 'slotNumber floor')
      .sort({ entryTime: -1 });

    const data = {
      slotCounts: slotCounts[0] || { total: 0, available: 0, occupied: 0, maintenance: 0 },
      activeSessions,
    };

    return NextResponse.json({ success: true, data });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}