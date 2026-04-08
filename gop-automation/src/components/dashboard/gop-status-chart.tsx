'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface StatusData {
  name: string
  value: number
  color: string
}

interface GOPStatusChartProps {
  data: StatusData[]
}

export function GOPStatusChart({ data }: GOPStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
        <CardDescription>{total} total requests</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} (${Math.round(((Number(value) ?? 0) / total) * 100)}%)`,
                name,
              ]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
