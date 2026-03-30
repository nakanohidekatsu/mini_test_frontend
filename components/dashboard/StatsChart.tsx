'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DailyActivity {
  date: string
  questions_answered: number
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

  const max = Math.max(...data.map(d => d.questions_answered), 1)

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12, color: '#f1f5f9' }}
          labelFormatter={v => {
            const d = new Date(v as string)
            return `${d.getMonth() + 1}月${d.getDate()}日`
          }}
          formatter={(v: number) => [`${v}問`, '回答数']}
        />
        <Bar dataKey="questions_answered" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.questions_answered > 0 ? '#3b82f6' : '#e2e8f0'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
