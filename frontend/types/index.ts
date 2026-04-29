export interface Event {
  id: number
  title_tr: string
  summary_tr: string
  category: string
  importance_score: number
  article_count: number
  country_codes: string[]
  has_tr_bias?: boolean
  image_url?: string
  video_url?: string | null
  published_at?: string
  created_at: string
  updated_at?: string
}

export interface Country {
  code: string
  name: string
  flag: string
  article_count: number
}

export interface ArticleSource {
  id: number
  title: string
  url: string
  source_name: string
  source_country: string
  source_bias: 'pro_gov' | 'opposition'
  published_at: string
}

export interface EventDetail extends Event {
  available_countries: Country[]
  articles: ArticleSource[]
}

export interface Tweet {
  username: string
  fullname: string
  content: string
  url: string
  date: string
  replies: string
  retweets: string
  likes: string
}

export interface PropagandaScores {
  propaganda: number
  emotion: number
  factual: number
  diversity: number
  rhetoric: string[]
}

export interface WordFrequency {
  word: string
  count: number
  sentiment: number
}

export interface Analysis {
  event_id: number
  country_code: string
  country_name: string
  flag: string
  pro_gov_summary: string
  opposition_summary: string
  consensus: string
  pro_gov_sources: string[]
  opposition_sources: string[]
  propaganda_scores?: {
    pro_gov?: PropagandaScores
    opposition?: PropagandaScores
  }
  word_frequencies?: {
    pro_gov: WordFrequency[]
    opposition: WordFrequency[]
  }
  cached: boolean
  created_at: string
}

export interface EventsResponse {
  events: Event[]
  total: number
  page: number
  per_page: number
}
