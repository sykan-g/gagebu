import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Entry = {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  memo: string;
  created_at: string;
};
