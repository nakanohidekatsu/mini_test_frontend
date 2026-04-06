'use client'

import { useHistory } from '@/hooks/useHistory'
import { Loader2, Calendar, BookOpen, Clock } from 'lucide-react'
import dynamic from 'next/dynamic'

const StatsChart = dynamic(() => import('@/components/dashboard/StatsChart'), { ssr: false })

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}分`
  return `${Math.floor(m / 60)}時間${m % 60}分`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default function HistoryPage() {
  const { logs, loading, error } = useHistory()

  const totalAnswered = logs.reduce((s, l) => s + l.questions_answered, 0)
  const totalSeconds = logs.reduce((s, l) => s + l.total_seconds, 0)
  const activeDays = logs.filter(l => l.questions_answered > 0).length

  const chartData = logs
    .slice()
    .reverse()
    .map(l => ({
      date: l.study_date,
      questions_answered: l.questions_answered,
      accuracy_rate: l.questions_answered > 0 ? Math.round(l.correct_answers / l.questions_answered * 100) : null,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">学習履歴</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">過去30日間の学習記録</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 text-sm">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
              <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalAnswered}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">総回答数</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
              <Clock className="w-5 h-5 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatDuration(totalSeconds)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">総学習時間</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
              <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeDays}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">学習日数</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">回答数の推移</h2>
            <StatsChart data={chartData} />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">学習履歴がありません</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(log.study_date)}</span>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>{log.questions_answered}問</span>
                    <span>{formatDuration(log.total_seconds)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
