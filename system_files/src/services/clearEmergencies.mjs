import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tdomiogiabjomkhjkres.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb21pb2dpYWJqb21raGprcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTEwNjksImV4cCI6MjEwMDY4NzA2OX0.gBVxScPK_BFdrXPW-ib2sxQ2ZZ0bebPCHvLhxwjiGOs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanEmergencies() {
  console.log('Cleaning old stale emergencies in Supabase...');
  const { data, error } = await supabase.from('emergencies').delete().neq('id', -1);
  if (error) {
    console.error('Error clearing emergencies:', error.message);
  } else {
    console.log('✓ Successfully cleared old emergencies in Supabase.');
  }
}

cleanEmergencies();
