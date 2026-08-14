// MamaTrack GPS — Supabase Client & Connection Service
import { createClient } from '@supabase/supabase-js';
import { errorMessage } from './errors';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface SupabaseConnectionResult {
  success: boolean;
  message: string;
  url?: string;
  latencyMs?: number;
  details?: unknown;
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
      url: supabaseUrl || 'Not provided'
    };
  }

  const startTime = Date.now();
  try {
    // Ping Supabase auth/health or attempt a lightweight query
    const { data, error } = await supabase.from('users').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      // If table doesn't exist yet, but connection reached Supabase instance:
      if (error.code === 'PGRST301' || error.message.includes('relation') || error.code === '42P01') {
        return {
          success: true,
          message: `Connected to Supabase successfully (${latencyMs}ms), but the database tables have not been created yet. Schema setup required.`,
          url: supabaseUrl,
          latencyMs,
          details: error
        };
      }

      return {
        success: false,
        message: `Supabase connection failed: ${error.message}`,
        url: supabaseUrl,
        latencyMs,
        details: error
      };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase instance! (${latencyMs}ms latency)`,
      url: supabaseUrl,
      latencyMs,
      details: { sampleCount: data?.length || 0 }
    };
  } catch (err) {
    return {
      success: false,
      message: `Supabase connection error: ${errorMessage(err, 'Unknown network error')}`,
      url: supabaseUrl,
      details: err
    };
  }
}
