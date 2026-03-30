import { Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ReviewQueueCardProps {
  count: number
}

export default function ReviewQueueCard({ count }: ReviewQueueCardProps) {
  return (
    <div className={`rounded-xl p-4 border ${count > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${count > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
            <Clock className={`w-5 h-5 ${count > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">今日の復習</p>
            <p className={`text-2xl font-bold ${count > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
              {count}問
            </p>
          </div>
        </div>
        {count > 0 && (
          <Link
            href="/quiz"
            className="flex items-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            開始 <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
