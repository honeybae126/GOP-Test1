'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface TrendData {
  month: string
  submitted: number
  approved: number
  rejected: number
}

interface MonthlyTrendChartProps {
  data: TrendData[]
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Monthly GOP Activity</CardTitle>
        <CardDescription>Submissions, approvals, and rejections per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="square"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{value}</span>
              )}
            />
            <Bar dataKey="submitted" name="Submitted" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
