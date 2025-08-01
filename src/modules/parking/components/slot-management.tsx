// components/parking/SlotsManagement.tsx
"use client";

import { useState } from 'react';
import { useAllSlotsQuery, ParkingSlotData } from '@/actions/slot-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SlotStatus } from '@/types/enums';
import { toast } from 'sonner';
import { SlotStatusBadge } from './slot-status-badge';
import { UpdateSlotStatusDialog } from './update-slot-status-dialog';

export function SlotsManagement() {
  const { data: slots, isLoading, isError } = useAllSlotsQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlotData | null>(null);

  const openUpdateDialog = (slot: ParkingSlotData) => {
    // Business Rule: Prevent updating the status of an occupied slot
    if (slot.status === SlotStatus.OCCUPIED) {
        toast.warning("Cannot update status of an occupied slot.");
        return;
    }
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  if (isError) {
    return <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">Failed to load slot data.</div>;
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Slot Management</CardTitle>
          <CardDescription>View all parking slots and manage their maintenance status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Show skeleton loaders while data is being fetched
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : (
                slots?.map((slot: ParkingSlotData) => (
                  <TableRow key={slot._id}>
                    <TableCell className="font-medium">{slot.slotNumber}</TableCell>
                    <TableCell>{slot.slotType}</TableCell>
                    <TableCell>
                      <SlotStatusBadge status={slot.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openUpdateDialog(slot)} 
                        disabled={slot.status === SlotStatus.OCCUPIED}
                      >
                        Update Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Render the dialog, controlling its state from here */}
      <UpdateSlotStatusDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        slot={selectedSlot}
      />
    </>
  );
}