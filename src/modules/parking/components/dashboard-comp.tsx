// components/parking/DashboardComponents.tsx
"use client";

import { Car, Bike, ParkingSquare, Zap, BadgeCheck, Clock, Hash, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCheckOutMutation } from '@/actions/parking-actions';
import { format } from 'date-fns';
import { LiveDuration } from './live-duration'; // Import the new component
import { VehicleType } from '@/types/enums';

// --- Stat Card Component ---
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}

export function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// --- Active Sessions Table Component ---
interface ActiveSession {
  _id: string;
  numberPlate: string;
  entryTime: string;
  vehicleId: {
    vehicleType: VehicleType;
  };
  slotId: {
    slotNumber: string;
  };
}

interface ActiveSessionsTableProps {
  sessions: ActiveSession[];
}

const vehicleIcons: { [key: string]: React.ElementType } = {
  [VehicleType.CAR]: Car,
  [VehicleType.BIKE]: Bike,
  [VehicleType.EV]: Zap,
  [VehicleType.HANDICAP_ACCESSIBLE]: ParkingSquare,
};

export function ActiveSessionsTable({ sessions }: ActiveSessionsTableProps) {
  const { mutate: checkOut, isPending } = useCheckOutMutation();

  const handleCheckOut = (sessionId: string) => {
    if (!isPending) {
      checkOut({ sessionId });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeCheck className="h-6 w-6 text-green-500" />
          Active Parking Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle Type</TableHead>
              <TableHead>Number Plate</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Entry Time</TableHead>
              {/* Add new column header */}
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No vehicles currently parked.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => {
                const Icon = vehicleIcons[session.vehicleId.vehicleType] || Car;
                return (
                  <TableRow key={session._id}>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-2 w-fit">
                        <Icon className="h-4 w-4" />
                        {session.vehicleId.vehicleType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">{session.numberPlate}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            {session.slotId.slotNumber}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(session.entryTime), 'dd MMM, hh:mm a')}
                        </div>
                    </TableCell>
                    {/* Add new cell with the LiveDuration component */}
                    <TableCell>
                      <LiveDuration startTime={session.entryTime} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleCheckOut(session._id)}
                        disabled={isPending}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Check-Out
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}