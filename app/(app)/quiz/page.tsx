'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Loader2, BookOpen, Shuffle, RotateCcw, AlertCircle, FolderOpen } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import type { QuizMode, QuestionSet } from '@/types'

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

  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState('')
  const [loadingSets, setLoadingSets] = useState(false)

  useEffect(() => {
    setLoadingSets(true)
    apiRequest<QuestionSet[]>('/api/v1/question-sets')
      .then(setQuestionSets)
      .catch(() => {})
      .finally(() => setLoadingSets(false))
  }, [])

  async function startQuiz() {
    setLoading(true)
    setError('')
    try {
      const effectiveMode = selectedSetId ? 'question_set' : mode
      const body: Record<string, unknown> = { mode: effectiveMode, limit }
      if (selectedSetId) body.question_set_id = selectedSetId
      const data = await apiRequest<QuizStartResponse>('/api/v1/quiz/start', {
        method: 'POST',
        body: JSON.stringify(body),
      })
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
        {/* 問題集選択（最初に表示） */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <span className="flex items-center gap-1.5"><FolderOpen className="w-4 h-4" />問題集（任意）</span>
          </label>
          {loadingSets ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />読み込み中...
            </div>
          ) : questionSets.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              問題集がありません。
              <a href="/question-sets" className="text-primary-600 hover:underline ml-1">問題集を作成する →</a>
            </p>
          ) : (
            <select
              value={selectedSetId}
              onChange={e => setSelectedSetId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">すべての問題（指定なし）</option>
              {questionSets.map(s => (
                <option key={s.id} value={s.id}>{s.name}（{s.question_count ?? 0}問）</option>
              ))}
            </select>
          )}
        </div>

        {/* 出題モード（問題集未選択時のみ有効） */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">出題モード</p>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                disabled={!!selectedSetId}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                  selectedSetId
                    ? 'border-slate-200 dark:border-slate-600 opacity-40 cursor-not-allowed'
                    : mode === value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${!selectedSetId && mode === value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${!selectedSetId && mode === value ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
          {selectedSetId && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">問題集を選択中はランダムモードで出題されます</p>
          )}
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
