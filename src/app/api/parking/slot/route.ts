// app/api/parking/slots/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/db';
import { ParkingSlot } from '@/models';
import { SlotType } from '@/types/enums';
import { z } from 'zod';

// Zod schema for a single slot object
const slotSchema = z.object({
  slotNumber: z.string().regex(/^[A-Z0-9]+[-][A-Z0-9]+$/, "Slot number must be in FLOOR-NUMBER format (e.g., B1-12)"),
  floor: z.string().min(1, "Floor is required."),
  slotType: z.nativeEnum(SlotType),
});

// Zod schema for an array of slots (for bulk creation)
const createSlotsSchema = z.array(slotSchema).min(1, "At least one slot must be provided.");

/**
 * @description Create one or more parking slots in bulk.
 * This is used for initially setting up the parking lot layout.
 */
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate the incoming array of slots
    const validation = createSlotsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const slotsToCreate = validation.data;

    // Use insertMany for efficient bulk insertion.
    // `ordered: false` will attempt to insert all valid documents, even if some have duplicate key errors.
    const result = await ParkingSlot.insertMany(slotsToCreate, { ordered: false });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully created ${result.length} new parking slots.`,
        data: result,
      },
      { status: 201 }
    );

  } catch (error: any) {
    // Handle potential duplicate key errors if a slotNumber already exists
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more slot numbers already exist. Please provide unique slot numbers.",
          details: error.writeErrors?.map((e: any) => `Slot '${e.err.op.slotNumber}' failed.`),
        },
        { status: 409 } // 409 Conflict
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}