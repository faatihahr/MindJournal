'use server';

import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const startTime = Date.now();
  console.log('[DEBUG] Login action started at:', new Date().toISOString());
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('[DEBUG] Attempting login for email:', email);

  const supabase = await createClient();

  const authStartTime = Date.now();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  const authEndTime = Date.now();

  console.log('[DEBUG] Auth operation took:', authEndTime - authStartTime, 'ms');
  console.log('[DEBUG] Total login action took:', authEndTime - startTime, 'ms');

  if (error) {
    console.log('[DEBUG] Login error:', error.message);
    return { error: error.message };
  }

  console.log('[DEBUG] Login successful');
  return { success: true };
}
