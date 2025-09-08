export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      analyses: {
        Row: {
          id: string
          created_by: string | null
          url: string
          url_canonical: string
          tier: 'speedrun' | 'mvp' | 'prod-lite'
          fingerprint: string
          result: Json
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          created_by?: string | null
          url: string
          url_canonical: string
          tier: 'speedrun' | 'mvp' | 'prod-lite'
          fingerprint: string
          result: Json
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string | null
          url?: string
          url_canonical?: string
          tier?: 'speedrun' | 'mvp' | 'prod-lite'
          fingerprint?: string
          result?: Json
          is_public?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Analysis = Database['public']['Tables']['analyses']['Row']
export type AnalysisInsert = Database['public']['Tables']['analyses']['Insert']

export interface AnalysisResult {
  total_hours: number
  confidence: number
  missions: Mission[]
  product_map: {
    roles: string[]
    objects: string[]
    stories: UserStory[]
  }
  evidence: Evidence[]
  scope: string
}

export interface Mission {
  category: string
  title: string
  hours: number
  confidence: number
}

export interface UserStory {
  role: string
  i_can: string
}

export interface Evidence {
  url: string
  snippet: string
} 