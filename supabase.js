import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://inlyskjkymtoamfqtjn.supabase.co';
const supabaseKey = 'sb_publishable_4ao85NMJuzQkqsmbGKMZVQ_MRmiXJnz';

export const supabase = createClient(supabaseUrl, supabaseKey);
