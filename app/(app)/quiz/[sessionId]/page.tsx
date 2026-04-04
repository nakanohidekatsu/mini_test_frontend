'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Volume2, VolumeX, CheckCircle, XCircle, ArrowRight, Trophy } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import { clsx } from 'clsx'

interface Choice {
  id: string
  choice_text: string
  display_order: number
}

interface QuizQuestion {
  id: string
  question_text: string
  question_choices: Choice[]
}

interface AnswerResponse {
  is_correct: boolean
  correct_choice_id: string
  explanation: string | null
  next_review_at: string | null
}

interface FinishResponse {
  session_id: string
  score: number
  total: number
}

export default function QuizSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null)
  const [finished, setFinished] = useState(false)
  const [finishData, setFinishData] = useState<FinishResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const questionStartTime = useRef(Date.now())

  useEffect(() => {
    const stored = sessionStorage.getItem(`quiz_${sessionId}`)
    if (stored) {
      const qs: QuizQuestion[] = JSON.parse(stored)
      qs.forEach(q => {
        for (let i = q.question_choices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [q.question_choices[i], q.question_choices[j]] = [q.question_choices[j], q.question_choices[i]]
        }
      })
      setQuestions(qs)
    }
  }, [sessionId])

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentIndex])

  const currentQuestion = questions[currentIndex]
  const choices = currentQuestion?.question_choices ?? []

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    window.speechSynthesis.speak(utterance)
  }, [ttsEnabled])

  useEffect(() => {
    if (currentQuestion && ttsEnabled) {
      speak(currentQuestion.question_text)
    }
  }, [currentIndex, currentQuestion, speak, ttsEnabled])

  async function handleAnswer(choiceId: string) {
    if (answerResult || submitting) return
    setSelectedChoice(choiceId)
    setSubmitting(true)
    const elapsedSeconds = Math.floor((Date.now() - questionStartTime.current) / 1000)

    try {
      const result = await apiRequest<AnswerResponse>('/api/v1/quiz/answer', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          question_id: currentQuestion.id,
          selected_choice_id: choiceId,
          elapsed_seconds: elapsedSeconds,
        }),
      })
      setAnswerResult(result)
      if (result.is_correct) {
        speak('正解です！')
      } else {
        speak('不正解です。')
      }
    } catch {
      // Continue even on error
    } finally {
      setSubmitting(false)
    }
  }

  async function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      // Finish
      try {
        const result = await apiRequest<FinishResponse>('/api/v1/quiz/finish', {
          method: 'POST',
          body: JSON.stringify({ session_id: sessionId }),
        })
        setFinishData(result)
      } catch {
        setFinishData({ session_id: sessionId, score: 0, total: questions.length })
      }
      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedChoice(null)
      setAnswerResult(null)
      setElapsed(0)
      questionStartTime.current = Date.now()
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (answerResult) {
        if (e.key === 'Enter') handleNext()
        return
      }
      const num = parseInt(e.key)
      if (num >= 1 && num <= choices.length) {
        handleAnswer(choices[num - 1].id)
      }
      if (e.key === ' ') {
        e.preventDefault()
        if (currentQuestion) speak(currentQuestion.question_text + ' ' + choices.map((c, i) => `${i + 1}. ${c.choice_text}`).join(' '))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [answerResult, choices, currentQuestion, handleAnswer, handleNext, speak])

  if (finished && finishData) {
    const accuracy = Math.round((finishData.score / finishData.total) * 100)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-sm w-full text-center shadow-lg"
        >
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">クイズ完了！</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">お疲れ様でした</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
              <p className="text-2xl font-bold text-primary-600">{finishData.score}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">正解数</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{finishData.total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">総問題数</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
              <p className={`text-2xl font-bold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {accuracy}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">正答率</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/quiz')}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              もう一度プレイ
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              ダッシュボードへ
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">問題を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-mono">{formatTime(elapsed)}</span>
          </div>
          <button
            onClick={() => {
              setTtsEnabled(v => !v)
              if (ttsEnabled) window.speechSynthesis?.cancel()
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={ttsEnabled ? '読み上げOFF' : '読み上げON'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
        >
          <p className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed mb-6">
            {currentQuestion.question_text}
          </p>

          {/* Choices */}
          <div className="space-y-2">
            {choices.map((choice, idx) => {
              const isSelected = selectedChoice === choice.id
              const isCorrect = answerResult?.correct_choice_id === choice.id
              const isWrong = isSelected && answerResult && !answerResult.is_correct

              let stateClass = 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
              if (answerResult) {
                if (isCorrect) stateClass = 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                else if (isWrong) stateClass = 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                else stateClass = 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 opacity-60'
              } else if (isSelected) {
                stateClass = 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleAnswer(choice.id)}
                  disabled={!!answerResult || submitting}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                    stateClass
                  )}
                  aria-label={`選択肢${idx + 1}: ${choice.choice_text}`}
                >
                  <span className={clsx(
                    'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border',
                    answerResult
                      ? isCorrect ? 'border-green-500 bg-green-500 text-white'
                        : isWrong ? 'border-red-500 bg-red-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 text-slate-400'
                      : isSelected ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  )}>
                    {idx + 1}
                  </span>
                  <span className="text-sm leading-snug">{choice.choice_text}</span>
                  {isCorrect && answerResult && <CheckCircle className="ml-auto w-5 h-5 text-green-500 shrink-0" />}
                  {isWrong && <XCircle className="ml-auto w-5 h-5 text-red-500 shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {answerResult && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 overflow-hidden"
              >
                <div className={clsx(
                  'rounded-xl p-4 border',
                  answerResult.is_correct
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {answerResult.is_correct
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <XCircle className="w-5 h-5 text-red-600" />
                    }
                    <span className={`font-semibold text-sm ${answerResult.is_correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {answerResult.is_correct ? '正解！' : '不正解'}
                    </span>
                  </div>
                  {answerResult.explanation && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {answerResult.explanation}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleNext}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                  autoFocus
                >
                  {currentIndex + 1 >= questions.length ? '結果を見る' : '次の問題'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        1〜4: 選択 / Enter: 次へ / Space: 読み上げ
      </p>
    </div>
  )
}
