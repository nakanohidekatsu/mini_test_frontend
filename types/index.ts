export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuizMode = 'random' | 'category' | 'srs' | 'weak' | 'question_set'
export type ParseStatus = 'pending' | 'processing' | 'done' | 'error'
export type SourceType = 'pdf' | 'image' | 'text' | 'csv' | 'json'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

export interface QuestionChoice {
  id: string
  question_id: string
  choice_text: string
  display_order: number
}

export interface QuestionSet {
  id: string
  user_id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  question_count?: number
}

export interface Question {
  id: string
  user_id: string
  source_id: string | null
  question_set_id: string | null
  category: string | null
  difficulty: Difficulty | null
  question_text: string
  explanation: string | null
  correct_choice_id: string | null
  created_at: string
  updated_at: string
  choices?: QuestionChoice[]
  tags?: string[]
}

export interface UserProgress {
  id: string
  user_id: string
  question_id: string
  total_attempts: number
  correct_attempts: number
  streak_correct: number
  last_answered_at: string | null
  next_review_at: string | null
  ease_factor: number
  mastery_level: number
}

export interface QuizSession {
  id: string
  user_id: string
  mode: QuizMode
  category: string | null
  started_at: string
  finished_at: string | null
  score: number
  total_questions: number
}

export interface QuizSessionAnswer {
  id: string
  session_id: string
  question_id: string
  selected_choice_id: string | null
  is_correct: boolean | null
  answered_at: string
  elapsed_seconds: number | null
}

export interface DashboardData {
  total_questions: number
  mastered_questions: number
  weak_questions: number
  review_due_count: number
  today_studied: number
  streak_days: number
  accuracy_rate: number
  category_stats: CategoryStat[]
  weekly_activity: DailyActivity[]
}

export interface CategoryStat {
  category: string
  total: number
  correct: number
  accuracy: number
}

export interface DailyActivity {
  date: string
  questions_answered: number
  total_seconds: number
}

export interface QuestionFilters {
  status?: 'unlearned' | 'weak' | 'review' | 'mastered'
  category?: string
  difficulty?: Difficulty
  tag?: string
  keyword?: string
  question_set_id?: string
  page?: number
  per_page?: number
}
