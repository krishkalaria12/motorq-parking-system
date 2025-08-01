import { useState } from 'react';
import { useUpdateSlotStatusMutation, ParkingSlotData } from '@/actions/slot-actions';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Wrench, CheckCircle } from 'lucide-react';
import { SlotStatus } from '@/types/enums';
import { toast } from 'sonner';
import { SlotStatusBadge } from './slot-status-badge';

interface UpdateDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  slot: ParkingSlotData | null;
}

export function UpdateSlotStatusDialog({ isOpen, setIsOpen, slot }: UpdateDialogProps) {
  const [reason, setReason] = useState("");
  const { mutate: updateStatus, isPending } = useUpdateSlotStatusMutation();

  if (!slot) return null;

  const handleMaintenance = () => {
    if (!reason.trim()) {
      toast.error("A reason is required to set a slot to maintenance.");
      return;
    }
    updateStatus({ slotId: slot._id, status: SlotStatus.MAINTENANCE, reason }, {
      onSuccess: () => {
        setReason("");
        setIsOpen(false);
      },
    });
  };

  const handleAvailable = () => {
    updateStatus({ slotId: slot._id, status: SlotStatus.AVAILABLE }, {
      onSuccess: () => {
        setReason("");
        setIsOpen(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Status for {slot.slotNumber}</DialogTitle>
          <DialogDescription>
            Current status: <SlotStatusBadge status={slot.status} />
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            {/* Show maintenance form if the slot is NOT currently in maintenance */}
            {slot.status !== SlotStatus.MAINTENANCE && (
              <div className="space-y-2">
                <Label htmlFor="reason">Maintenance Reason</Label>
                <Input id="reason" placeholder="e.g., Cleaning, Broken Charger" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button className="w-full" variant="destructive" onClick={handleMaintenance} disabled={isPending}>
                  <Wrench className="mr-2 h-4 w-4" /> Set to Maintenance
                </Button>
              </div>
            )}

            {/* Show "Mark as Available" button if the slot IS currently in maintenance */}
            {slot.status === SlotStatus.MAINTENANCE && (
              <Button className="w-full" variant="default" onClick={handleAvailable} disabled={isPending}>
                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Available
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}