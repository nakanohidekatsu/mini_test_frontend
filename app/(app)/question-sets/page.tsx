'use client'

import { useState, useEffect } from 'react'
import { FolderOpen, Plus, Pencil, Trash2, Loader2, BookOpen, Check, X } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import type { QuestionSet } from '@/types'
import Link from 'next/link'

export default function QuestionSetsPage() {
  const [sets, setSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 新規作成フォーム
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  // 編集
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    fetchSets()
  }, [])

  async function fetchSets() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest<QuestionSet[]>('/api/v1/question-sets')
      setSets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const created = await apiRequest<QuestionSet>('/api/v1/question-sets', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      })
      setSets(prev => [created, ...prev])
      setCreating(false)
      setNewName('')
      setNewDesc('')
    } catch (err) {
      alert(err instanceof Error ? err.message : '作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(s: QuestionSet) {
    setEditingId(s.id)
    setEditName(s.name)
    setEditDesc(s.description)
  }

  async function handleUpdate(setId: string) {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const updated = await apiRequest<QuestionSet>(`/api/v1/question-sets/${setId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }),
      })
      setSets(prev => prev.map(s => s.id === setId ? updated : s))
      setEditingId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(setId: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？\n問題集内の問題は削除されません。`)) return
    try {
      await apiRequest(`/api/v1/question-sets/${setId}`, { method: 'DELETE' })
      setSets(prev => prev.filter(s => s.id !== setId))
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">問題集</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">問題をグループにまとめて管理する</p>
        </div>
        <button
          onClick={() => { setCreating(true); setNewName(''); setNewDesc('') }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新しい問題集
        </button>
      </div>

      {/* 新規作成フォーム */}
      {creating && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-primary-300 dark:border-primary-700 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">新しい問題集を作成</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="問題集の名前（必須）"
            autoFocus
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="説明（任意）"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              作成
            </button>
          </div>
        </div>
      )}

      {/* 一覧 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : sets.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">問題集がありません</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">「新しい問題集」ボタンで作成してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sets.map(s => (
            <div key={s.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              {editingId === s.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="説明（任意）"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdate(s.id)}
                      disabled={saving || !editName.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg shrink-0">
                    <FolderOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/questions?question_set_id=${s.id}`}
                      className="text-base font-semibold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {s.name}
                    </Link>
                    {s.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{s.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        {s.question_count ?? 0}問
                      </span>
                      <Link
                        href={`/questions?question_set_id=${s.id}`}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        問題一覧 →
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(s)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      title="編集"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
