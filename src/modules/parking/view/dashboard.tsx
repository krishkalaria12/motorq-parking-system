// app/page.tsx
"use client";

import { ParkingSquare, CheckCircle, XCircle, Wrench, AlertTriangle } from 'lucide-react';
import { useDashboardQuery } from '@/actions/parking-actions';
import { StatCard, ActiveSessionsTable } from '@/modules/parking/components/dashboard-comp';
import { CheckInDialog } from '@/modules/parking/components/check-in-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardQuery();

  const stats = data?.slotCounts || { total: 0, available: 0, occupied: 0, maintenance: 0 };
  const sessions = data?.activeSessions || [];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="container mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Parking Dashboard</h1>
            <p className="text-muted-foreground">Real-time overview of parking operations.</p>
          </div>
          <CheckInDialog />
        </header>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[125px] w-full" />)
          ) : (
            <>
              <StatCard title="Total Slots" value={stats.total} icon={ParkingSquare} color="text-gray-500" />
              <StatCard title="Available" value={stats.available} icon={CheckCircle} color="text-green-500" />
              <StatCard title="Occupied" value={stats.occupied} icon={XCircle} color="text-red-500" />
              <StatCard title="Maintenance" value={stats.maintenance} icon={Wrench} color="text-amber-500" />
            </>
          )}
        </div>

        {isError && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Active Sessions Table */}
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <ActiveSessionsTable sessions={sessions} />
        )}
      </main>
    </div>
  );
}