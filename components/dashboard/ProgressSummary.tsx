interface ProgressSummaryProps {
  answered: number
  target?: number
  totalSeconds: number
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}分`
  return `${Math.floor(m / 60)}時間${m % 60}分`
}

export default function ProgressSummary({ answered, target = 20, totalSeconds }: ProgressSummaryProps) {
  const pct = Math.min(100, Math.round((answered / target) * 100))
  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-600 dark:text-slate-400">今日の進捗</span>
          <span className="font-semibold text-slate-900 dark:text-white">{answered} / {target}問</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>学習時間</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{formatDuration(totalSeconds)}</span>
      </div>
    </div>
  )
}
