import dbConnect from "@/db";
import { ParkingSlot } from "@/models";
import { NextResponse } from "next/server";
import { SlotType } from "@/types/enums";

// GET - Fetch all slots
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

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const slotsData = await request.json();
    
    // Validate that we received an array
    if (!Array.isArray(slotsData)) {
      return NextResponse.json(
        { success: false, error: 'Expected an array of slots' }, 
        { status: 400 }
      );
    }

    // Validate each slot has required fields
    for (const slot of slotsData) {
      if (!slot.floor || !slot.slotNumber || !slot.slotType) {
        return NextResponse.json(
          { success: false, error: 'Each slot must have floor, slotNumber, and slotType' }, 
          { status: 400 }
        );
      }

      // Validate slot type
      if (!Object.values(SlotType).includes(slot.slotType)) {
        return NextResponse.json(
          { success: false, error: `Invalid slot type: ${slot.slotType}` }, 
          { status: 400 }
        );
      }
    }

    // Check for duplicate slot numbers
    const slotNumbers = slotsData.map(slot => slot.slotNumber);
    const existingSlots = await ParkingSlot.find({ 
      slotNumber: { $in: slotNumbers } 
    });

    if (existingSlots.length > 0) {
      const duplicateNumbers = existingSlots.map(slot => slot.slotNumber);
      return NextResponse.json(
        { 
          success: false, 
          error: `Slot numbers already exist: ${duplicateNumbers.join(', ')}` 
        }, 
        { status: 409 }
      );
    }

    // Create the slots
    const createdSlots = await ParkingSlot.insertMany(slotsData);
    
    return NextResponse.json({ 
      success: true, 
      data: createdSlots,
      message: `Successfully created ${createdSlots.length} slots`
    });

  } catch (error) {
    console.error('Error creating slots:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage }, 
      { status: 500 }
    );
  }
}