'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Loader2, BookOpen, Clock, Shuffle, RotateCcw, AlertCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import type { QuizMode } from '@/types'

interface QuizStartResponse {
  session_id: string
  questions: Array<{
    id: string
    question_text: string
    question_choices: Array<{ id: string; choice_text: string; display_order: number }>
  }>
}

const MODES: Array<{ value: QuizMode; label: string; icon: React.ElementType; desc: string }> = [
  { value: 'random', label: 'ランダム', icon: Shuffle, desc: '全問題からランダム出題' },
  { value: 'srs', label: '復習 (SRS)', icon: RotateCcw, desc: '今日復習すべき問題を出題' },
  { value: 'weak', label: '苦手問題', icon: AlertCircle, desc: '正答率の低い問題を優先' },
  { value: 'category', label: 'カテゴリ別', icon: BookOpen, desc: 'カテゴリを選んで出題' },
]

export default function QuizStartPage() {
  const router = useRouter()
  const [mode, setMode] = useState<QuizMode>('random')
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startQuiz() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest<QuizStartResponse>('/api/v1/quiz/start', {
        method: 'POST',
        body: JSON.stringify({ mode, limit }),
      })
      // Store questions in sessionStorage for the quiz session
      sessionStorage.setItem(`quiz_${data.session_id}`, JSON.stringify(data.questions))
      router.push(`/quiz/${data.session_id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'クイズを開始できませんでした')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">クイズ</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">出題モードを選んで学習を始める</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">出題モード</p>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                  mode === value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${mode === value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${mode === value ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            問題数: <span className="text-primary-600 font-semibold">{limit}問</span>
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>5問</span><span>10問</span><span>15問</span><span>20問</span><span>25問</span><span>30問</span>
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-base"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          クイズ開始
        </button>
      </div>
    </div>
  )
}
