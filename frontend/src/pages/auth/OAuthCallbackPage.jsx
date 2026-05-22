import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://fcllhdeiknlthwqpafiy.supabase.co', 'sb_publishable_RXp-v2R5nmE7SCyygiGHHw_XlWXHcKR')
// ---cut---
supabase.auth.signInWithOAuth({
  provider: 'google',
})