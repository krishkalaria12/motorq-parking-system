import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BillingSummary } from '@/actions/billing-actions';

interface RevenueTableProps {
  data: BillingSummary | undefined;
}

export function RevenueTable({ data }: RevenueTableProps) {
  const tableData = [
    {
      type: 'Hourly',
      revenue: data?.breakdown.hourly.revenue || 0,
      sessions: data?.breakdown.hourly.sessions || 0,
    },
    {
      type: 'Day Pass',
      revenue: data?.breakdown.dayPass.revenue || 0,
      sessions: data?.breakdown.dayPass.sessions || 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Breakdown</CardTitle>
        <CardDescription>Detailed revenue and session counts by billing type.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Billing Type</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right">Total Sessions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.type}>
                <TableCell className="font-medium">{row.type}</TableCell>
                <TableCell className="text-right">₹{row.revenue.toFixed(2)}</TableCell>
                <TableCell className="text-right">{row.sessions}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">₹{data?.totalRevenue.toFixed(2) ?? '0.00'}</TableCell>
                <TableCell className="text-right">{data?.totalSessions ?? '0'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}