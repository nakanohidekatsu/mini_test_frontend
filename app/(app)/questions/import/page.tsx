'use client'

import { useState } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ImportResult {
  imported: number
  errors: Array<{ row?: number; index?: number; error: string }>
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<'csv' | 'json'>('csv')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/import/${importType}`,
        { method: 'POST', headers, body: formData }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'インポートに失敗しました')
      }
      setResult(await res.json())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/questions" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">問題インポート</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">CSV / JSON ファイルから問題を一括登録</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ファイル形式</p>
          <div className="flex gap-3">
            {(['csv', 'json'] as const).map(t => (
              <button
                key={t}
                onClick={() => setImportType(t)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  importType === t
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-medium text-slate-700 dark:text-slate-300">フォーマット例 ({importType.toUpperCase()})</p>
          {importType === 'csv' ? (
            <pre className="overflow-x-auto">{`question_text,choices,correct_index,explanation,category,difficulty
"問題文","[\\"選択肢A\\",\\"選択肢B\\",\\"選択肢C\\",\\"選択肢D\\"]",0,"解説文","カテゴリ","easy"`}</pre>
          ) : (
            <pre className="overflow-x-auto">{`{
  "questions": [
    {
      "question_text": "問題文",
      "choices": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "解説",
      "category": "カテゴリ",
      "difficulty": "easy"
    }
  ]
}`}</pre>
          )}
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ファイルを選択</label>
            <input
              type="file"
              accept={importType === 'csv' ? '.csv' : '.json'}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/20 dark:file:text-primary-400 hover:file:bg-primary-100 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <p className="font-medium text-sm">{result.imported}問をインポートしました</p>
              </div>
              {result.errors.length > 0 && (
                <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                  <p className="font-medium">警告: {result.errors.length}件のエラー</p>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <p key={i}>{e.row ? `行${e.row}` : `インデックス${e.index}`}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            インポート実行
          </button>
        </form>
      </div>
    </div>
  )
}
