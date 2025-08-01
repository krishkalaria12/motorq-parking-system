/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { z } from 'zod';

import dbConnect from '@/db';
import { ParkingSlot } from '@/models';
import { SlotStatus } from '@/types/enums';

// Schema to validate the request body
const maintenanceSchema = z.object({
  status: z.enum([SlotStatus.MAINTENANCE, SlotStatus.AVAILABLE]),
  reason: z.string().optional(),
}).refine(data => {
    return data.status !== SlotStatus.MAINTENANCE || (data.status === SlotStatus.MAINTENANCE && typeof data.reason === 'string' && data.reason.length > 0);
}, {
    message: "A reason is required to put a slot into maintenance.",
    path: ["reason"],
});


interface RouteContext {
  params: {
    slotId: string;
  };
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await dbConnect();
    const { slotId } = params;
    const body = await request.json();

    const validation = maintenanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status, reason } = validation.data;

    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ success: false, error: "Parking slot not found." }, { status: 404 });
    }

    // Cannot put an OCCUPIED slot into maintenance
    if (status === SlotStatus.MAINTENANCE && slot.status === SlotStatus.OCCUPIED) {
      return NextResponse.json(
        { success: false, error: "Cannot put an occupied slot into maintenance. Please check-out the vehicle first." },
        { status: 409 }
      );
    }

    const updatePayload: any = {
        status: status,
    };

    if (status === SlotStatus.MAINTENANCE) {
        updatePayload.maintenanceReason = reason;
        updatePayload.maintenanceStartTime = new Date();
    } else {
        // If marking as available, remove maintenance fields
        updatePayload.$unset = { maintenanceReason: 1, maintenanceStartTime: 1 };
    }

    const updatedSlot = await ParkingSlot.findByIdAndUpdate(
      slotId,
      updatePayload,
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedSlot }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}