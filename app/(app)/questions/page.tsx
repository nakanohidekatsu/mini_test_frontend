'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Plus, Download, Upload, BookOpen, Loader2, Trash2, FolderOpen } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import type { Question, Difficulty, QuestionFilters, QuestionSet } from '@/types'
import Link from 'next/link'

interface QuestionsResponse {
  questions: Question[]
  page: number
  per_page: number
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '易',
  medium: '中',
  hard: '難',
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function QuestionsPage() {
  const searchParams = useSearchParams()
  const initialSetId = searchParams.get('question_set_id') ?? undefined

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<QuestionFilters>({ page: 1, per_page: 20, question_set_id: initialSetId })
  const [keyword, setKeyword] = useState('')

  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])

  useEffect(() => {
    apiRequest<QuestionSet[]>('/api/v1/question-sets').then(setQuestionSets).catch(() => {})
  }, [])

  async function handleDelete(questionId: string) {
    if (!confirm('この問題を削除しますか？')) return
    try {
      await apiRequest(`/api/v1/questions/${questionId}`, { method: 'DELETE' })
      setQuestions(prev => prev.filter(q => q.id !== questionId))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.status) params.set('status', filters.status)
      if (filters.keyword) params.set('keyword', filters.keyword)
      if (filters.question_set_id) params.set('question_set_id', filters.question_set_id)
      params.set('page', String(filters.page ?? 1))
      params.set('per_page', String(filters.per_page ?? 20))
      const data = await apiRequest<QuestionsResponse>(`/api/v1/questions?${params}`)
      setQuestions(data.questions)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters(f => ({ ...f, keyword, page: 1 }))
  }

  const activeSetName = questionSets.find(s => s.id === filters.question_set_id)?.name

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">問題一覧</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{questions.length}問</p>
        </div>
        <div className="flex gap-2">
          <Link href="/questions/import" className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">インポート</span>
          </Link>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/export/csv`}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">エクスポート</span>
          </a>
          <Link href="/upload" className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">AI生成</span>
          </Link>
        </div>
      </div>

      {/* Search & filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="問題文を検索..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            検索
          </button>
        </form>

        {/* 問題集フィルタ */}
        {questionSets.length > 0 && (
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filters.question_set_id ?? ''}
              onChange={e => setFilters(f => ({ ...f, question_set_id: e.target.value || undefined, page: 1 }))}
              className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">すべての問題集</option>
              {questionSets.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => setFilters(f => ({ ...f, difficulty: f.difficulty === d ? undefined : d, page: 1 }))}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filters.difficulty === d
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
              }`}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
          {(filters.difficulty || filters.question_set_id) && (
            <button
              onClick={() => setFilters(f => ({ ...f, difficulty: undefined, question_set_id: undefined, page: 1 }))}
              className="px-3 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* アクティブフィルタ表示 */}
      {activeSetName && (
        <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
          <FolderOpen className="w-4 h-4" />
          <span>問題集: <strong>{activeSetName}</strong></span>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">問題がありません</p>
          <Link href="/upload" className="mt-3 inline-block text-primary-600 text-sm hover:underline">
            AI解析で問題を生成する →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => {
            const setName = questionSets.find(s => s.id === q.question_set_id)?.name
            return (
              <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                <span className="shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 dark:text-white text-sm font-medium line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {setName && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                        <FolderOpen className="w-3 h-3" />{setName}
                      </span>
                    )}
                    {q.category && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                        {q.category}
                      </span>
                    )}
                    {q.difficulty && (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                        {DIFFICULTY_LABELS[q.difficulty]}
                      </span>
                    )}
                    {q.tags?.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
