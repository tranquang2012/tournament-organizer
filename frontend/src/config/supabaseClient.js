import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://fcllhdeiknlthwqpafiy.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_RXp-v2R5nmE7SCyygiGHHw_XlWXHcKR'
)
