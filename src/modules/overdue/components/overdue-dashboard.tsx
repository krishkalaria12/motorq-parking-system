import { useMemo } from 'react';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ActiveSession, useCheckOutMutation } from '@/actions/parking-actions';
import { LiveDuration } from '@/modules/parking/components/live-duration';
import { AlertTriangle, LogOut } from 'lucide-react';

// The overstay threshold from our backend
const OVERSTAY_THRESHOLD_HOURS = 6;

interface OverdueSessionsTabProps {
  sessions: ActiveSession[];
}

export function OverdueSessionsTab({ sessions }: OverdueSessionsTabProps) {
  const { mutate: checkOut, isPending } = useCheckOutMutation();

  // Memoize the calculation for overdue time
  const sessionsWithOverdue = useMemo(() => {
    return sessions.map(session => {
      const entryDate = new Date(session.entryTime);
      const overdueMinutes = differenceInMinutes(new Date(), entryDate) - (OVERSTAY_THRESHOLD_HOURS * 60);
      const overdueDuration = overdueMinutes > 0 
        ? formatDistanceToNow(new Date().setMinutes(new Date().getMinutes() - overdueMinutes))
        : 'Calculating...';
      
      return {
        ...session,
        overdueDuration,
      };
    });
  }, [sessions]);

  return (
    <Card className="shadow-lg border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle />
          Overdue Vehicles
        </CardTitle>
        <CardDescription>
          These vehicles have exceeded the {OVERSTAY_THRESHOLD_HOURS}-hour parking limit. Please take appropriate action.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number Plate</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Total Duration</TableHead>
              <TableHead>Overdue By</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionsWithOverdue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No overdue vehicles at the moment.
                </TableCell>
              </TableRow>
            ) : (
              sessionsWithOverdue.map((session) => (
                <TableRow key={session._id} className="bg-destructive/5 hover:bg-destructive/10">
                  <TableCell className="font-mono font-semibold">{session.numberPlate}</TableCell>
                  <TableCell>{session.slotId.slotNumber}</TableCell>
                  <TableCell>
                    <LiveDuration startTime={session.entryTime} />
                  </TableCell>
                  <TableCell className="font-medium text-destructive">
                    {session.overdueDuration}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => checkOut({ sessionId: session._id })}
                      disabled={isPending}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Check-Out
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}