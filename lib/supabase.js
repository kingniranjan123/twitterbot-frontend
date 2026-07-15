import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://srgkjdgxdzqxflleqkse.supabase.co'
const supabaseKey = 'sb_publishable_WQQrzD-y9GE6kLIpypsC6g_2g7kDzkP'

export const supabase = createClient(supabaseUrl, supabaseKey)
