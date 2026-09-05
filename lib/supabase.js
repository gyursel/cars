import { createClient } from '@supabase/supabase-js';

// Dedicated Supabase project for vehicle images.
// Values come from .env.local locally and from Vercel Environment Variables online.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wyzlvhjdghoiqrymkues.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3dYmhynyHyBzagLFRmR0GQ_QnQ49FiO';

export const supabase = createClient(supabaseUrl, supabaseKey);
