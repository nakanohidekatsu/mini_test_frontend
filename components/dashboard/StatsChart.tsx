'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DailyActivity {
  date: string
  questions_answered: number
  accuracy_rate: number | null
}

interface StatsChartProps {
  data: DailyActivity[]
}

export default function StatsChart({ data }: StatsChartProps) {
  if (!data.length) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        データがありません
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <ComposedChart data={data} margin={{ top: 4, right: 28, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={v => {
            const d = new Date(v)
            return `${d.getMonth() + 1}/${d.getDate()}`
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }}
          labelFormatter={v => {
            const d = new Date(v as string)
            return `${d.getMonth() + 1}月${d.getDate()}日`
          }}
          formatter={(v: number, name: string) => {
            if (name === 'questions_answered') return [`${v}問`, '回答数']
            if (name === 'accuracy_rate') return [`${v}%`, '正答率']
            return [v, name]
          }}
        />
        <Bar yAxisId="left" dataKey="questions_answered" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.questions_answered > 0 ? '#3b82f6' : '#e2e8f0'} />
          ))}
        </Bar>
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="accuracy_rate"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
