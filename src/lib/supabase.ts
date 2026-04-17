import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ffylxadhegvvwxrmyktt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmeWx4YWRoZWdddnd4cm15a3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ0MDAwNTcsImV4cCI6MjAyOTk4MDA1N30.fake_key_for_demo'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Contact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status?: string
  pipeline_status?: string
  created_at: string
  updated_at?: string
  product?: string
  price?: number
  produkt?: string | null
  startzeitpunkt?: string | null
  tags?: string[] | null
  source?: string
}

export type Deal = {
  id: string
  title: string
  contact_id: string | null
  value: number | null
  stage: string
  created_at: string
}

export type Activity = {
  id: string
  contact_id: string | null
  deal_id: string | null
  type: string
  text: string | null
  created_at: string
}
