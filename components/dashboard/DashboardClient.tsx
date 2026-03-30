'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { apiRequest } from '@/lib/api/client'
import ReviewQueueCard from './ReviewQueueCard'
import ProgressSummary from './ProgressSummary'
import { Trophy, Upload } from 'lucide-react'
import Link from 'next/link'

const StatsChart = dynamic(() => import('./StatsChart'), { ssr: false })

interface StudyLog {
  study_date: string
  questions_answered: number
}

interface DashboardClientProps {
  reviewDueCount: number
  todayAnswered: number
  todaySeconds: number
  hasQuestions: boolean
}

export default function DashboardClient({ reviewDueCount, todayAnswered, todaySeconds, hasQuestions }: DashboardClientProps) {
  const [history, setHistory] = useState<StudyLog[]>([])

  useEffect(() => {
    apiRequest<StudyLog[]>('/api/v1/progress/history').then(setHistory).catch(() => {})
  }, [])

  // Fill last 14 days
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().split('T')[0]
    const log = history.find(l => l.study_date === dateStr)
    return { date: dateStr, questions_answered: log?.questions_answered ?? 0 }
  })

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <ReviewQueueCard count={reviewDueCount} />
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">今日の目標</h2>
          {!hasQuestions ? (
            <div className="text-center py-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">まだ問題がありません</p>
              <Link href="/upload" className="inline-flex items-center gap-2 text-primary-600 text-sm hover:underline">
                <Upload className="w-4 h-4" />
                問題を追加する
              </Link>
            </div>
          ) : (
            <ProgressSummary answered={todayAnswered} totalSeconds={todaySeconds} />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">過去14日間の学習</h2>
          <StatsChart data={chartData} />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-3">クイックスタート</h2>
          <div className="space-y-2">
            <Link href="/quiz" className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-700 dark:text-primary-400 hover:bg-primary-100 transition-colors">
              <Trophy className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">クイズを始める</p>
                <p className="text-xs opacity-70">ランダム出題で学習</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
