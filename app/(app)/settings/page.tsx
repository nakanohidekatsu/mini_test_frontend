'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) setTheme(saved)
  }, [])

  function applyTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem('theme', t)
    const root = document.documentElement
    if (t === 'dark') root.classList.add('dark')
    else if (t === 'light') root.classList.remove('dark')
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark')
      else root.classList.remove('dark')
    }
  }

  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'ライト', icon: Sun },
    { value: 'dark', label: 'ダーク', icon: Moon },
    { value: 'system', label: 'システム', icon: Monitor },
  ]

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">設定</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">テーマ</h2>
        <div className="flex gap-3">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => applyTheme(value)}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                theme === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
