import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration error: Missing environment variables.');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING (Check .env.local)');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'MISSING (Check .env.local)');
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);
