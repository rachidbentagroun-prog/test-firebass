
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lsfcdwobelblcumychxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZmNkd29iZWxibGN1bXljaHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDUxMzYsImV4cCI6MjA4MTY4MTEzNn0.-CFGHtoPhwXK9PbfXWjVJwaGcNf8wGCmJ7c1uxlHrF0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
