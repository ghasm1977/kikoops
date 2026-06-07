import { createClient } from '@supabase/supabase-js'
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://dourrjhhkkkfvjsiqvwu.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Gibpk1thF40NAxb7qnYRhQ_n2YtxJeS'
export const supabase = createClient(URL, KEY)
