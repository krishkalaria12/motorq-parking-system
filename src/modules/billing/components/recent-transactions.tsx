// components/parking/RecentTransactionsTable.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompletedSession } from '@/actions/billing-actions';

interface RecentTransactionsTableProps {
  transactions: CompletedSession[];
  page: number;
  setPage: (page: number) => void;
  totalSessions: number;
}

// Helper to format duration from minutes to a readable string
function formatDuration(minutes: number): string {
    if (!minutes || minutes < 1) return "Less than a minute";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m` : ''}`.trim();
}

export function RecentTransactionsTable({ transactions, page, setPage, totalSessions }: RecentTransactionsTableProps) {
  const totalPages = Math.ceil(totalSessions / 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>A list of recently completed parking sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Plate</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Billing Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                    transactions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>
                            <div className="font-medium">{session.numberPlate}</div>
                            <div className="text-xs text-muted-foreground">{session.vehicleType}</div>
                        </TableCell>
                        <TableCell>{formatDuration(session.duration)}</TableCell>
                        <TableCell><Badge variant="outline">{session.billingType}</Badge></TableCell>
                        <TableCell className="text-right font-mono">₹{session.billingAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No transactions for this period.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
        {/* Pagination Controls */}
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages > 0 ? totalPages : 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}