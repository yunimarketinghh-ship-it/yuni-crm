import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ffylxadhegvvwxrmyktt.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmeWx4YWRoZWd2dnd4cm15a3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzk3MDEsImV4cCI6MjA4ODgxNTcwMX0.VfhzFiX0acJ1NPK4eB-EbouKllguH188JK9pAGpWobs'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type UserRole = 'admin' | 'sales_rep'

export type Profile = {
  id: string
  name: string
  full_name?: string | null
  email?: string | null
  role: UserRole
  created_at: string
}

export type Contact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  tags: string[] | null
  pipeline_status: string
  produkt: string | null
  startzeitpunkt: string | null
  verwendungszweck: string | null
  lead_date: string | null
  source: string | null
  price: number | null
  notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at?: string
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
  user_id: string | null
  created_by?: string | null
  type: string
  text?: string | null
  description?: string | null
  created_at: string
}
