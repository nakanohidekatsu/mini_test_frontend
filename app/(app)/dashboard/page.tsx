import { createClient } from '@/lib/supabase/server'
import { BookOpen, Clock, Target, Flame, Play, Upload } from 'lucide-react'
import Link from 'next/link'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date().toISOString()
  const todayDate = new Date()
  const todayStr = todayDate.toISOString().split('T')[0]
  const todayStart = todayStr + 'T00:00:00Z'
  const tomorrowDate = new Date(todayDate)
  tomorrowDate.setUTCDate(todayDate.getUTCDate() + 1)
  const tomorrowStart = tomorrowDate.toISOString().split('T')[0] + 'T00:00:00Z'

  const [
    { count: totalQuestions },
    { count: reviewDue },
    { count: todayAnswerCount },
    { data: streakLogs },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .lte('next_review_at', now),
    supabase.from('quiz_session_answers')
      .select('*', { count: 'exact', head: true })
      .gte('answered_at', todayStart)
      .lt('answered_at', tomorrowStart),
    supabase.from('study_logs')
      .select('study_date')
      .eq('user_id', user!.id)
      .order('study_date', { ascending: false })
      .limit(365),
  ])

  // 昨日まで何日連続で回答しているか算出
  const logDates = new Set((streakLogs ?? []).map((l: { study_date: string }) => l.study_date))
  let streakDays = 0
  for (let i = 1; ; i++) {
    const d = new Date(todayDate)
    d.setUTCDate(todayDate.getUTCDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (logDates.has(dateStr)) {
      streakDays++
    } else {
      break
    }
  }

  // 今日の学習ログ（学習時間の表示用）
  const { data: todayLog } = await supabase.from('study_logs')
    .select('questions_answered, total_seconds')
    .eq('user_id', user!.id)
    .eq('study_date', todayStr)
    .maybeSingle()

  const stats = [
    { label: '総問題数', value: totalQuestions ?? 0, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: '復習待ち', value: reviewDue ?? 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: '今日の回答', value: todayAnswerCount ?? 0, icon: Target, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: '連続日数', value: streakDays, icon: Flame, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ダッシュボード</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">学習状況の概要</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <DashboardClient
        reviewDueCount={reviewDue ?? 0}
        todayAnswered={todayLog?.questions_answered ?? 0}
        todaySeconds={todayLog?.total_seconds ?? 0}
        hasQuestions={(totalQuestions ?? 0) > 0}
      />
    </div>
  )
}
