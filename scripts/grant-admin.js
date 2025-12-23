#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lsfcdwobelblcumychxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZmNkd29iZWxibGN1bXljaHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDUxMzYsImV4cCI6MjA4MTY4MTEzNn0.-CFGHtoPhwXK9PbfXWjVJwaGcNf8wGCmJ7c1uxlHrF0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const email = process.argv[2] || 'isambk92@gmail.com';

async function run() {
  try {
    console.log(`Looking up profile for ${email}...`);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, plan, credits')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      console.error('No profile found for that email.');
      process.exit(1);
    }

    console.log('Profile found:', { id: data.id, email: data.email, role: data.role });

    const updates = {
      role: 'admin',
      plan: 'premium',
      credits: 99999,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', data.id);

    if (updateError) throw updateError;

    console.log(`Successfully granted admin to ${email} (id: ${data.id}).`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to grant admin:', err);
    process.exit(1);
  }
}

run();
