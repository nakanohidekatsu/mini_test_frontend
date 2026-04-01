'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, File, Loader2, CheckCircle, AlertCircle, Sparkles, X, FolderOpen } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import type { QuestionSet } from '@/types'

interface ParseResult {
  source_id: string
  raw_text: string
}

interface GenerateResult {
  generated: number
  questions: { id: string; question_text: string }[]
}

type FileStatus = 'pending' | 'parsing' | 'parsed' | 'generating' | 'done' | 'error'

interface FileEntry {
  file: File
  sourceName: string
  status: FileStatus
  error?: string
  sourceId?: string
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [maxQuestions, setMaxQuestions] = useState(10)
  const [running, setRunning] = useState(false)
  const [totalGenerated, setTotalGenerated] = useState<number | null>(null)
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState('')

  useEffect(() => {
    apiRequest<QuestionSet[]>('/api/v1/question-sets').then(setQuestionSets).catch(() => {})
  }, [])

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (pdfs.length === 0) return
    setFiles(prev => [
      ...prev,
      ...pdfs.map(f => ({ file: f, sourceName: f.name.replace(/\.pdf$/i, ''), status: 'pending' as FileStatus })),
    ])
    setTotalGenerated(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, patch: Partial<FileEntry>) => {
    setFiles(prev => prev.map((e, i) => i === index ? { ...e, ...patch } : e))
  }

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  async function processAll() {
    setRunning(true)
    setTotalGenerated(null)
    const headers = await getAuthHeaders()
    const snapshot = [...files]
    const targets = snapshot.map((f, i) => ({ ...f, index: i })).filter(f => f.status !== 'done')

    // === Phase 1: 全ファイルを解析 ===
    const parsedResults: { index: number; sourceId: string }[] = []

    for (const entry of targets) {
      updateEntry(entry.index, { status: 'parsing', error: undefined })
      try {
        const formData = new FormData()
        formData.append('file', entry.file)
        formData.append('source_type', 'pdf')
        formData.append('source_name', entry.sourceName)

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/parse/source`, {
          method: 'POST',
          headers,
          body: formData,
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.detail ?? 'アップロードに失敗しました')
        }
        const parsed: ParseResult = await res.json()
        updateEntry(entry.index, { status: 'parsed', sourceId: parsed.source_id })
        parsedResults.push({ index: entry.index, sourceId: parsed.source_id })
      } catch (err) {
        updateEntry(entry.index, { status: 'error', error: err instanceof Error ? err.message : 'エラーが発生しました' })
      }
    }

    if (parsedResults.length === 0) {
      setRunning(false)
      return
    }

    // === Phase 2: 全 source_id をまとめて1回のAI生成 ===
    parsedResults.forEach(({ index }) => updateEntry(index, { status: 'generating' }))

    try {
      const generateBody: Record<string, unknown> = {
        source_ids: parsedResults.map(r => r.sourceId),
        max_questions: maxQuestions,
      }
      if (selectedSetId) generateBody.question_set_id = selectedSetId

      const result = await apiRequest<GenerateResult>('/api/v1/generate/questions', {
        method: 'POST',
        body: JSON.stringify(generateBody),
      })

      parsedResults.forEach(({ index }) => updateEntry(index, { status: 'done' }))
      setTotalGenerated(result.generated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '問題生成に失敗しました'
      parsedResults.forEach(({ index }) => updateEntry(index, { status: 'error', error: msg }))
    }

    setRunning(false)
  }

  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length
  const hasFiles = files.length > 0
  const allDone = hasFiles && files.every(f => f.status === 'done')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI解析・問題生成</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">複数PDFをまとめて解析し、一括で問題を生成</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
        }`}
      >
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">PDFをドラッグ＆ドロップ（複数可）</p>
        <p className="text-slate-400 text-xs mt-1">または</p>
        <label className="mt-3 inline-block cursor-pointer">
          <input type="file" className="hidden" accept=".pdf" multiple onChange={handleFileChange} />
          <span className="text-primary-600 text-sm hover:underline">ファイルを選択</span>
        </label>
      </div>

      {/* File list */}
      {hasFiles && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {files.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <File className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={entry.sourceName}
                  onChange={e => updateEntry(i, { sourceName: e.target.value })}
                  disabled={entry.status !== 'pending'}
                  className="w-full text-sm text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 disabled:opacity-70 truncate"
                />
                <p className="text-xs text-slate-400 truncate">{entry.file.name} · {(entry.file.size / 1024).toFixed(0)} KB</p>
                {entry.error && <p className="text-xs text-red-500 mt-0.5">{entry.error}</p>}
              </div>
              <div className="shrink-0">
                {entry.status === 'pending' && (
                  <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {entry.status === 'parsing' && (
                  <div className="flex items-center gap-1.5 text-xs text-primary-600">
                    <Loader2 className="w-4 h-4 animate-spin" />解析中
                  </div>
                )}
                {entry.status === 'parsed' && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CheckCircle className="w-4 h-4 text-slate-400" />解析完了
                  </div>
                )}
                {entry.status === 'generating' && (
                  <div className="flex items-center gap-1.5 text-xs text-primary-600">
                    <Loader2 className="w-4 h-4 animate-spin" />AI生成中
                  </div>
                )}
                {entry.status === 'done' && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle className="w-4 h-4" />完了
                  </div>
                )}
                {entry.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 生成結果 */}
      {totalGenerated !== null && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {files.filter(f => f.status === 'done').length}ファイルから合計 <strong>{totalGenerated}問</strong> を生成しました
        </div>
      )}

      {/* 問題集選択 */}
      {hasFiles && questionSets.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <span className="flex items-center gap-1.5"><FolderOpen className="w-4 h-4" />問題集に追加（任意）</span>
          </label>
          <select
            value={selectedSetId}
            onChange={e => setSelectedSetId(e.target.value)}
            disabled={running}
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">問題集に追加しない</option>
            {questionSets.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Max questions */}
      {hasFiles && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            生成問題数（全ファイル合計）: <span className="text-primary-600 font-semibold">{maxQuestions}問</span>
          </label>
          <input
            type="range"
            min={5}
            max={50}
            value={maxQuestions}
            onChange={e => setMaxQuestions(Number(e.target.value))}
            disabled={running}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>5問</span>
            <span>50問</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {hasFiles && (
        <div className="flex items-center gap-3">
          <button
            onClick={processAll}
            disabled={running || pendingCount === 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" />処理中...</>
            ) : (
              <><Sparkles className="w-4 h-4" />{pendingCount}件を解析・生成</>
            )}
          </button>
          {allDone && (
            <a href="/questions" className="px-4 py-3 text-primary-600 text-sm font-medium hover:underline">
              問題一覧を見る →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
