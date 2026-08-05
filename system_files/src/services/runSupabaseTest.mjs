import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].replace(/"/g, '').trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].replace(/"/g, '').trim();
    }
  });
}

console.log('================================================================');
console.log('         MAMATRACK GPS - SUPABASE CONNECTION TEST               ');
console.log('================================================================');
console.log('Supabase Project URL:', supabaseUrl || '[NOT CONFIGURED - EMPTY]');
console.log('Supabase Anon Key:   ', supabaseAnonKey ? '[PRESENT]' : '[NOT CONFIGURED - EMPTY]');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.log('\n[STATUS]: PENDING CREDENTIALS');
  console.log('Supabase client module (@supabase/supabase-js) installed & configured!');
  console.log('Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect.');
  process.exit(0);
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const start = Date.now();
  const { data, error } = await supabase.from('users').select('id').limit(1);
  const latency = Date.now() - start;

  if (error) {
    if (error.code === 'PGRST301' || error.message.includes('relation') || error.code === '42P01') {
      console.log(`\n[STATUS]: SUCCESS - Connected to Supabase Instance (${latency}ms)!`);
      console.log(`[NOTE]: Database tables not initialized yet. Ready to apply DDL schema.`);
    } else {
      console.log(`\n[STATUS]: FAILED - ${error.message}`);
    }
  } else {
    console.log(`\n[STATUS]: SUCCESS - Live Database Connection Verified! (${latency}ms)`);
    console.log(`Retrieved ${data ? data.length : 0} records from 'users' table.`);
  }
} catch (err) {
  console.error('\n[STATUS]: ERROR - Connection Exception:', err.message);
}
