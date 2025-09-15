import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      children: {
        Row: {
          child_id: string
          child_name: string
          dob: string
          consultant: string
          created_at: string
        }
        Insert: {
          child_id: string
          child_name: string
          dob: string
          consultant: string
          created_at?: string
        }
        Update: {
          child_id?: string
          child_name?: string
          dob?: string
          consultant?: string
          created_at?: string
        }
      }
      artifacts: {
        Row: {
          id: number
          child_id: string
          kind: string
          filename: string
          content: string
          created_at: string
        }
        Insert: {
          child_id: string
          kind: string
          filename: string
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          child_id?: string
          kind?: string
          filename?: string
          content?: string
          created_at?: string
        }
      }
      questions: {
        Row: {
          child_id: string
          payload: string
          created_at: string
        }
        Insert: {
          child_id: string
          payload: string
          created_at?: string
        }
        Update: {
          child_id?: string
          payload?: string
          created_at?: string
        }
      }
      answers: {
        Row: {
          child_id: string
          payload: string
          created_at: string
        }
        Insert: {
          child_id: string
          payload: string
          created_at?: string
        }
        Update: {
          child_id?: string
          payload?: string
          created_at?: string
        }
      }
      recommendations: {
        Row: {
          child_id: string
          payload: string
          created_at: string
        }
        Insert: {
          child_id: string
          payload: string
          created_at?: string
        }
        Update: {
          child_id?: string
          payload?: string
          created_at?: string
        }
      }
      plans: {
        Row: {
          child_id: string
          payload: string
          created_at: string
        }
        Insert: {
          child_id: string
          payload: string
          created_at?: string
        }
        Update: {
          child_id?: string
          payload?: string
          created_at?: string
        }
      }
    }
  }
}