import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://vhxhguxwryejuejhifes.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeGhndXh3cnllanVlamhpZmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDM3OTcsImV4cCI6MjEwMzQxOTc5N30.EZ7TnGXr4cKnCD23lQCvAyLAKxpXWXWrnHpKzp_mOqg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET_NAME = 'listing-images';
