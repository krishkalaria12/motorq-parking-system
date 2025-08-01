import dbConnect from "@/db";
import { ParkingSlot } from "@/models";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    // Find all slots and sort them by floor, then by slot number.
    const slots = await ParkingSlot.find({}).sort({ floor: 1, slotNumber: 1 });

    return NextResponse.json({ success: true, data: slots });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}