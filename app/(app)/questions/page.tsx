'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Plus, Download, Upload, BookOpen, Loader2, Trash2, FolderOpen, ChevronDown, ChevronUp, Save, X } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import type { Question, QuestionChoice, Difficulty, QuestionFilters, QuestionSet } from '@/types'
import Link from 'next/link'

interface QuestionsResponse {
  questions: Question[]
  page: number
  per_page: number
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: '易', medium: '中', hard: '難' }
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

interface EditState {
  question_text: string
  explanation: string
  category: string
  difficulty: Difficulty | ''
  question_set_id: string
  correct_choice_id: string
  choices: { id: string; choice_text: string; display_order: number }[]
}

function QuestionDetail({
  question,
  questionSets,
  onSaved,
  onDeleted,
}: {
  question: Question
  questionSets: QuestionSet[]
  onSaved: (updated: Question) => void
  onDeleted: () => void
}) {
  const choices = (question.choices ?? []).slice().sort((a, b) => a.display_order - b.display_order)

  const [edit, setEdit] = useState<EditState>({
    question_text: question.question_text,
    explanation: question.explanation ?? '',
    category: question.category ?? '',
    difficulty: question.difficulty ?? '',
    question_set_id: question.question_set_id ?? '',
    correct_choice_id: question.correct_choice_id ?? '',
    choices: choices.map(c => ({ id: c.id, choice_text: c.choice_text, display_order: c.display_order })),
  })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  function update<K extends keyof EditState>(key: K, value: EditState[K]) {
    setEdit(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function updateChoice(index: number, text: string) {
    setEdit(prev => ({
      ...prev,
      choices: prev.choices.map((c, i) => i === index ? { ...c, choice_text: text } : c),
    }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await apiRequest<Question>(`/api/v1/questions/${question.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          question_text: edit.question_text,
          explanation: edit.explanation || null,
          category: edit.category || null,
          difficulty: edit.difficulty || null,
          question_set_id: edit.question_set_id || null,
          correct_choice_id: edit.correct_choice_id || null,
          choices: edit.choices.map(c => ({ id: c.id, choice_text: c.choice_text })),
        }),
      })
      setDirty(false)
      onSaved(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('この問題を削除しますか？')) return
    try {
      await apiRequest(`/api/v1/questions/${question.id}`, { method: 'DELETE' })
      onDeleted()
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  return (
    <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4 pt-3 space-y-4 bg-slate-50 dark:bg-slate-900/50">
      {/* 問題文 */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">問題文</label>
        <textarea
          value={edit.question_text}
          onChange={e => update('question_text', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* 選択肢 */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">選択肢</label>
        <div className="space-y-2">
          {edit.choices.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={edit.correct_choice_id === c.id}
                onChange={() => update('correct_choice_id', c.id)}
                className="accent-primary-600 shrink-0"
                title="正解に設定"
              />
              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                edit.correct_choice_id === c.id
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <input
                type="text"
                value={c.choice_text}
                onChange={e => updateChoice(i, e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">ラジオボタンで正解を選択</p>
      </div>

      {/* 解説 */}
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">解説</label>
        <textarea
          value={edit.explanation}
          onChange={e => update('explanation', e.target.value)}
          rows={2}
          placeholder="解説文（任意）"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* メタ情報 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">カテゴリ</label>
          <input
            type="text"
            value={edit.category}
            onChange={e => update('category', e.target.value)}
            placeholder="例: 数学"
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">難易度</label>
          <select
            value={edit.difficulty}
            onChange={e => update('difficulty', e.target.value as Difficulty | '')}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">未設定</option>
            <option value="easy">易</option>
            <option value="medium">中</option>
            <option value="hard">難</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">問題集</label>
          <select
            value={edit.question_set_id}
            onChange={e => update('question_set_id', e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">未割り当て</option>
            {questionSets.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-colors"
        >
          <Trash2 className="w-4 h-4" />削除
        </button>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-slate-400">未保存の変更があります</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QuestionsPage() {
  const searchParams = useSearchParams()
  const initialSetId = searchParams.get('question_set_id') ?? undefined

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<QuestionFilters>({ page: 1, per_page: 20, question_set_id: initialSetId })
  const [keyword, setKeyword] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])

  useEffect(() => {
    apiRequest<QuestionSet[]>('/api/v1/question-sets').then(setQuestionSets).catch(() => {})
  }, [])

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

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  function handleSaved(updated: Question) {
    setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q))
  }

  function handleDeleted(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id))
    setExpandedId(null)
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
            const isExpanded = expandedId === q.id
            return (
              <div key={q.id} className={`bg-white dark:bg-slate-800 rounded-xl border transition-colors overflow-hidden ${
                isExpanded
                  ? 'border-primary-400 dark:border-primary-600'
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
              }`}>
                {/* 問題ヘッダー（クリックで展開） */}
                <button
                  onClick={() => toggleExpand(q.id)}
                  className="w-full flex items-start gap-4 p-4 text-left"
                >
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
                  <span className="shrink-0 text-slate-400 mt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* 詳細・編集パネル */}
                {isExpanded && (
                  <QuestionDetail
                    question={q}
                    questionSets={questionSets}
                    onSaved={handleSaved}
                    onDeleted={() => handleDeleted(q.id)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
