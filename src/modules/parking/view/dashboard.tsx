// app/page.tsx
"use client";

import { useState, useMemo } from 'react';
import { useDashboardQuery } from '@/actions/parking-actions';
import { StatCard, ActiveSessionsTable } from '@/modules/parking/components/dashboard-comp';
import { CheckInDialog } from '@/modules/parking/components/check-in-dialog';
import { DashboardFilters } from '@/modules/parking/components/dashboard-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParkingSquare, CheckCircle, XCircle, Wrench, AlertTriangle } from 'lucide-react';
import { VehicleType } from '@/types/enums';
import { SlotsManagement } from '../components/slot-management';
import { AddSlotsDialog } from '../components/add-slots-dialog';

export function DashboardPage() {
  const [filters, setFilters] = useState<{ vehicleType?: VehicleType | 'ALL'; numberPlate?: string }>({
    vehicleType: 'ALL',
    numberPlate: '',
  });

  // 1. Fetch the complete, unfiltered data from the API
  const { data, isLoading, isError, error } = useDashboardQuery();

  const handleFilterChange = (newFilter: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilter }));
  };

  const stats = data?.slotCounts || { total: 0, available: 0, occupied: 0, maintenance: 0 };
  
  // 2. Perform filtering on the client side using useMemo for performance
  const filteredSessions = useMemo(() => {
    // Return an empty array if there are no sessions to filter
    if (!data?.activeSessions) return [];

    // Apply filters to the session data
    return data.activeSessions.filter(session => {
      const typeMatch = filters.vehicleType === 'ALL' || session.vehicleId.vehicleType === filters.vehicleType;
      
      const plateMatch = !filters.numberPlate || 
                         session.numberPlate.includes(filters.numberPlate.toUpperCase());
                         
      return typeMatch && plateMatch;
    });
  }, [data?.activeSessions, filters]); // Re-run this logic only when the source data or filters change

  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="container mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Parking Dashboard</h1>
            <p className="text-muted-foreground">Real-time overview of parking operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <AddSlotsDialog />
            <CheckInDialog />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {isLoading && !data ? (
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

        {/* Tabbed Interface */}
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="slots">Slot Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="mt-4">
            <div className="mb-8">
              <DashboardFilters onFilterChange={handleFilterChange} />
            </div>
            {isLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <ActiveSessionsTable sessions={filteredSessions} />
            )}
          </TabsContent>

          <TabsContent value="slots" className="mt-4">
            <SlotsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
