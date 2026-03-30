'use client'

import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api/client'

interface DashboardData {
  total_questions: number
  review_due_count: number
  today_questions_answered: number
  today_total_seconds: number
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest<DashboardData>('/api/v1/progress/dashboard')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
