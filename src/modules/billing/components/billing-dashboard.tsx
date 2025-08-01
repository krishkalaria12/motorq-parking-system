import { useState } from 'react';
import { useBillingSummaryQuery, Period } from '@/actions/billing-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart, List } from 'lucide-react';
import { BillingStatCards } from './billing-stat-card';
import { RevenueChart } from './revenue-charts';
import { RevenueTable } from './revenue-table';
import { RecentTransactionsTable } from './recent-transactions';

type ViewType = 'chart' | 'table';

export function BillingDashboard() {
  const [period, setPeriod] = useState<Period>('today');
  const [view, setView] = useState<ViewType>('chart');
  const [page, setPage] = useState(1);
  
  // FIX: Pass the 'page' state as the second argument to the hook.
  const { data, isLoading, isError, error } = useBillingSummaryQuery(period, page);

  // When the period changes, reset the page to 1
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold self-start">Billing Overview</h2>
        <div className="flex items-center gap-2 self-end w-full md:w-auto">
            <Select defaultValue={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup type="single" value={view} onValueChange={(value: ViewType) => value && setView(value)} >
              <ToggleGroupItem value="chart" aria-label="Chart view"><BarChart className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view"><List className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
        </div>
      </div>

      {isError && (
        <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading billing data: {(error as Error).message}</span>
        </div>
      )}

      {/* Render Stat Cards */}
      <BillingStatCards data={data?.summary} isLoading={isLoading} />



      {/* Render Recent Transactions Table */}
      {isLoading && !data ? (
        <Skeleton className="h-[400px] mt-6" />
      ) : (
        <RecentTransactionsTable 
            transactions={data?.transactions || []}
            page={page}
            setPage={setPage}
            totalSessions={data?.summary.totalSessions || 0}
        />
      )}

      {/* Conditionally render Chart or Table */}
      {isLoading && !data ? (
        <Skeleton className="h-[450px]" />
      ) : (
        view === 'chart' ? <RevenueChart data={data?.summary} /> : <RevenueTable data={data?.summary} />
      )}
    </div>
  );
}