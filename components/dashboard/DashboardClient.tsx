'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { apiRequest } from '@/lib/api/client'
import ReviewQueueCard from './ReviewQueueCard'
import ProgressSummary from './ProgressSummary'
import { Trophy, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const StatsChart = dynamic(() => import('./StatsChart'), { ssr: false })

interface StudyLog {
  study_date: string
  questions_answered: number
  correct_answers: number
}

interface CategoryStat {
  tag: string
  accuracy: number
  total: number
}

interface CategoryStats {
  strong: CategoryStat[]
  weak: CategoryStat[]
}

interface DashboardClientProps {
  reviewDueCount: number
  todayAnswered: number
  todaySeconds: number
  hasQuestions: boolean
}

export default function DashboardClient({ reviewDueCount, todayAnswered, todaySeconds, hasQuestions }: DashboardClientProps) {
  const [history, setHistory] = useState<StudyLog[]>([])
  const [days, setDays] = useState<7 | 14 | 30>(14)
  const [showCategoryStats, setShowCategoryStats] = useState(false)
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null)
  const [loadingCategory, setLoadingCategory] = useState(false)

  useEffect(() => {
    apiRequest<StudyLog[]>('/api/v1/progress/history').then(setHistory).catch(() => {})
  }, [])

  function handleToggleCategoryStats() {
    if (!showCategoryStats && !categoryStats) {
      setLoadingCategory(true)
      apiRequest<CategoryStats>('/api/v1/progress/category-stats')
        .then(setCategoryStats)
        .catch(() => {})
        .finally(() => setLoadingCategory(false))
    }
    setShowCategoryStats(v => !v)
  }

  const chartData = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const dateStr = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
    const log = history.find(l => l.study_date === dateStr)
    const answered = log?.questions_answered ?? 0
    const correct = log?.correct_answers ?? 0
    return {
      date: dateStr,
      questions_answered: answered,
      accuracy_rate: answered > 0 ? Math.round(correct / answered * 100) : null,
    }
  })

  return (
    <div className="grid md:grid-cols-2 gap-4 pb-20 md:pb-0">
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
          <button
            onClick={handleToggleCategoryStats}
            className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-3"
          >
            過去の学習履歴
            {showCategoryStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <StatsChart data={chartData} />
          <div className="flex justify-end gap-1 mt-2">
            {([7, 14, 30] as const).map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  days === d
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {d}日
              </button>
            ))}
          </div>
          {showCategoryStats && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              {loadingCategory ? (
                <p className="text-sm text-slate-400 text-center py-2">読み込み中...</p>
              ) : !categoryStats || (categoryStats.strong.length === 0 && categoryStats.weak.length === 0) ? (
                <p className="text-sm text-slate-400 text-center py-2">データが不足しています</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">得意分類 TOP10</p>
                    <ol className="space-y-1">
                      {categoryStats.strong.map((s, i) => (
                        <li key={s.tag} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300 truncate">{i + 1}. {s.tag}</span>
                          <span className="text-green-600 dark:text-green-400 font-medium ml-1 shrink-0">{s.accuracy}%</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">不得意分類 TOP10</p>
                    <ol className="space-y-1">
                      {categoryStats.weak.map((s, i) => (
                        <li key={s.tag} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300 truncate">{i + 1}. {s.tag}</span>
                          <span className="text-red-600 dark:text-red-400 font-medium ml-1 shrink-0">{s.accuracy}%</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
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
