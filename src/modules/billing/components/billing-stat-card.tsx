import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Hash, PieChart } from 'lucide-react';
import { BillingSummary } from '@/actions/billing-actions';

interface BillingStatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

function StatCard({ title, value, icon: Icon }: BillingStatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

interface BillingStatCardsProps {
  data: BillingSummary | undefined;
  isLoading: boolean;
}

export function BillingStatCards({ data, isLoading }: BillingStatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Total Revenue" value={`₹${data?.totalRevenue.toFixed(2) ?? '0.00'}`} icon={DollarSign} />
      <StatCard title="Total Sessions" value={`${data?.totalSessions ?? '0'}`} icon={Hash} />
      <StatCard title="Avg. Revenue/Session" value={`₹${data?.averageRevenuePerSession.toFixed(2) ?? '0.00'}`} icon={PieChart} />
    </div>
  );
}