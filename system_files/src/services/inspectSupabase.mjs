import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tdomiogiabjomkhjkres.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb21pb2dpYWJqb21raGprcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTEwNjksImV4cCI6MjEwMDY4NzA2OX0.gBVxScPK_BFdrXPW-ib2sxQ2ZZ0bebPCHvLhxwjiGOs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectTables() {
  console.log('Testing Supabase tables status...');
  const { data: users, error } = await supabase.from('users').select('id, email, full_name, role');
  if (error) {
    console.error('Error fetching users from Supabase:', error);
  } else {
    console.log(`Found ${users?.length || 0} users in Supabase:`);
    console.log(users);
  }
}

inspectTables();
