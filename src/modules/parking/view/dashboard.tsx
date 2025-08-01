// app/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useDashboardQuery } from '@/actions/parking-actions';
import { StatCard, ActiveSessionsTable } from '@/modules/parking/components/dashboard-comp';
import { CheckInDialog } from '@/modules/parking/components/check-in-dialog';
import { DashboardFilters } from '@/modules/parking/components/dashboard-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Wrench, AlertTriangle, Car, LayoutGrid } from 'lucide-react';
import { VehicleType, SessionStatus } from '@/types/enums';
import { SlotsManagement } from '@/modules/parking/components/slot-management';
import { AddSlotsDialog } from '@/modules/parking/components/add-slots-dialog';
import { BillingDashboard } from '@/modules/billing/components/billing-dashboard';
import { useOverstayCheckQuery } from '@/actions/overstay-check-actions';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { OverdueSessionsTab } from '@/modules/overdue/components/overdue-dashboard';
import { Badge } from '@/components/ui/badge';

export function DashboardPage() {
  const [filters, setFilters] = useState<{ vehicleType?: VehicleType | 'ALL'; numberPlate?: string }>({
    vehicleType: 'ALL',
    numberPlate: '',
  });

  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useDashboardQuery();
  
  // Run the overstay check query in the background
  const { data: newlyFlaggedSessions } = useOverstayCheckQuery();

  // Use useEffect to handle the side effect (toast notification) from the background check
  useEffect(() => {
    if (newlyFlaggedSessions && newlyFlaggedSessions.length > 0) {
      toast.warning(
        `${newlyFlaggedSessions.length} vehicle(s) have overstayed. Please check the 'Overdue' tab.`
      );
      // Invalidate the main dashboard query to refresh the UI with the new OVERSTAY statuses
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  }, [newlyFlaggedSessions, queryClient]);


  const stats = data?.slotCounts || { total: 0, available: 0, occupied: 0, maintenance: 0 };
  
  // Separate all sessions into 'active' and 'overdue' lists
  const { activeSessions, overdueSessions } = useMemo(() => {
    const allSessions = data?.activeSessions || [];
    return {
      activeSessions: allSessions.filter(s => s.status === SessionStatus.ACTIVE),
      overdueSessions: allSessions.filter(s => s.status === SessionStatus.OVERSTAY),
    };
  }, [data?.activeSessions]);

  // Apply search/filter only to the 'active' sessions list
  const filteredActiveSessions = useMemo(() => {
    return activeSessions.filter(session => {
      const typeMatch = filters.vehicleType === 'ALL' || session.vehicleId.vehicleType === filters.vehicleType;
      const plateMatch = !filters.numberPlate || session.numberPlate.includes(filters.numberPlate.toUpperCase());
      return typeMatch && plateMatch;
    });
  }, [activeSessions, filters]);

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {isLoading && !data ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[125px] w-full" />)
            ) : (
                <>
                <StatCard title="Total Slots" value={stats.total} icon={LayoutGrid} color="text-gray-500" />
                <StatCard title="Available" value={stats.available} icon={CheckCircle} color="text-green-500" />
                <StatCard title="Occupied" value={stats.occupied} icon={Car} color="text-red-500" />
                <StatCard title="Maintenance" value={stats.maintenance} icon={Wrench} color="text-amber-500" />
                </>
            )}
        </div>

        {isError && ( 
            <Alert variant="destructive" className="mb-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
        )}

        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="overdue" className="relative">
              Overdue
              {overdueSessions.length > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{overdueSessions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="slots">Slot Management</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="mt-4">
            <div className="mb-8"><DashboardFilters onFilterChange={(f) => setFilters(p => ({...p, ...f}))} /></div>
            {isLoading ? <Skeleton className="h-[400px] w-full" /> : <ActiveSessionsTable sessions={filteredActiveSessions} />}
          </TabsContent>

          <TabsContent value="overdue" className="mt-4">
            <OverdueSessionsTab sessions={overdueSessions} />
          </TabsContent>

          <TabsContent value="slots" className="mt-4"><SlotsManagement /></TabsContent>
          <TabsContent value="billing" className="mt-4"><BillingDashboard /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}