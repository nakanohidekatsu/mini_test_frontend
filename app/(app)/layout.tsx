import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/shared/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppNav user={user} />
      <main className="md:ml-56 px-4 py-6">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
