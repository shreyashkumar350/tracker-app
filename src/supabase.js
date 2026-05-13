import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jiuktjlwvoflujaotkag.supabase.co'
const supabaseKey = 'sb_publishable_0DrF7jk73RKYnewu4LrZPw_LqcYCj7g'

export const supabase = createClient(supabaseUrl, supabaseKey)