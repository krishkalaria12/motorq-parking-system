// app/api/billing/summary/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/db';
import { ParkingSession } from '@/models';
import { SessionStatus, BillingType } from '@/types/enums';
import { z } from 'zod';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const summaryQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month']).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  // Add pagination parameters
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const searchParams = request.nextUrl.searchParams;

    const queryParams = {
        period: searchParams.get('period'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
    };

    const validation = summaryQuerySchema.safeParse(queryParams);
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    let { startDate, endDate, page, limit } = validation.data;
    const now = new Date();
    
    switch (validation.data.period) {
        case 'today':
            startDate = startOfDay(now).toISOString();
            endDate = endOfDay(now).toISOString();
            break;
        case 'week':
            startDate = startOfWeek(now).toISOString();
            endDate = endOfWeek(now).toISOString();
            break;
        case 'month':
            startDate = startOfMonth(now).toISOString();
            endDate = endOfMonth(now).toISOString();
            break;
    }

    if (!startDate || !endDate) {
        return NextResponse.json({ success: false, error: "A time period or date range must be specified." }, { status: 400 });
    }

    const dateMatch = {
        status: SessionStatus.COMPLETED,
        exitTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    // --- We will run two queries in parallel for efficiency ---
    const [summaryResult, transactionsResult] = await Promise.all([
      // Query 1: Get the aggregate summary data
      ParkingSession.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$billingAmount' },
            totalSessions: { $sum: 1 },
            hourlyRevenue: { $sum: { $cond: [{ $eq: ['$billingType', BillingType.HOURLY] }, '$billingAmount', 0] } },
            dayPassRevenue: { $sum: { $cond: [{ $eq: ['$billingType', BillingType.DAY_PASS] }, '$billingAmount', 0] } },
            hourlySessions: { $sum: { $cond: [{ $eq: ['$billingType', BillingType.HOURLY] }, 1, 0] } },
            dayPassSessions: { $sum: { $cond: [{ $eq: ['$billingType', BillingType.DAY_PASS] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1, totalSessions: 1,
            averageRevenuePerSession: { $cond: [{ $eq: ['$totalSessions', 0] }, 0, { $divide: ['$totalRevenue', '$totalSessions'] }] },
            breakdown: {
              hourly: { revenue: '$hourlyRevenue', sessions: '$hourlySessions' },
              dayPass: { revenue: '$dayPassRevenue', sessions: '$dayPassSessions' },
            },
          },
        },
      ]),
      // Query 2: Get the paginated list of individual transactions
      ParkingSession.aggregate([
        { $match: dateMatch },
        { $sort: { exitTime: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        // Join with other collections to get details
        { $lookup: { from: 'vehicles', localField: 'vehicleId', foreignField: '_id', as: 'vehicleDetails' } },
        { $lookup: { from: 'parkingslots', localField: 'slotId', foreignField: '_id', as: 'slotDetails' } },
        // Reshape the data
        {
          $project: {
            _id: 1, numberPlate: 1, billingType: 1, billingAmount: 1,
            entryTime: 1, exitTime: 1, duration: 1,
            vehicleType: { $arrayElemAt: ['$vehicleDetails.vehicleType', 0] },
            slotNumber: { $arrayElemAt: ['$slotDetails.slotNumber', 0] },
          }
        }
      ])
    ]);

    const summary = summaryResult[0] || { /* default zeroed object */ };

    return NextResponse.json({ 
        success: true, 
        data: {
            summary,
            transactions: transactionsResult
        } 
    }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}