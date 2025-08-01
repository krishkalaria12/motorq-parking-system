import { Badge } from "@/components/ui/badge";
import { SlotStatus } from "@/types/enums";

// Helper to map slot status to a badge color variant
const statusVariantMap: Record<SlotStatus, "default" | "destructive" | "secondary"> = {
  [SlotStatus.AVAILABLE]: "default",
  [SlotStatus.OCCUPIED]: "secondary",
  [SlotStatus.MAINTENANCE]: "destructive",
};

interface SlotStatusBadgeProps {
  status: SlotStatus;
}

export function SlotStatusBadge({ status }: SlotStatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]}>
      {status}
    </Badge>
  );
}