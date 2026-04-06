'use client'

import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api/client'

interface StudyLog {
  id: string
  study_date: string
  total_seconds: number
  questions_answered: number
  correct_answers: number
}

export function useHistory() {
  const [logs, setLogs] = useState<StudyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest<StudyLog[]>('/api/v1/progress/history')
      .then(setLogs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { logs, loading, error }
}
