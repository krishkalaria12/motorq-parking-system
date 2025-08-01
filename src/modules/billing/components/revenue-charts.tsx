import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BillingSummary } from '@/actions/billing-actions';

interface RevenueChartProps {
  data: BillingSummary | undefined;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = [
    { name: 'Hourly', revenue: data?.breakdown.hourly.revenue || 0, fill: "var(--color-hourly)" },
    { name: 'Day Pass', revenue: data?.breakdown.dayPass.revenue || 0, fill: "var(--color-dayPass)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Breakdown</CardTitle>
        <CardDescription>Revenue from Hourly vs. Day Pass parking.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            revenue: {
              label: "Revenue (₹)",
              color: "hsl(var(--chart-1))",
            },
            hourly: {
                label: "Hourly",
                color: "hsl(var(--chart-2))",
            },
            dayPass: {
                label: "Day Pass",
                color: "hsl(var(--chart-3))",
            }
          }}
          className="min-h-[350px] w-full"
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis unit="₹" />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue (₹)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
