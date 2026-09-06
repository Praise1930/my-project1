// MamaTrack GPS — Supabase Client & Connection Service
import { createClient } from '@supabase/supabase-js';
import { errorMessage } from './errors';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin client with service_role key — used ONLY for privileged operations
// such as deleting Auth users. This bypasses RLS by design.
const isAdminConfigured = Boolean(isSupabaseConfigured && supabaseServiceRoleKey);
export const supabaseAdmin = isAdminConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

/**
 * Delete a user from Supabase Auth by their email address.
 * This ensures re-registration with the same email works after admin deletion.
 * Requires the service_role key to be configured.
 */
export async function deleteSupabaseAuthUser(email: string): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Admin client not configured (missing VITE_SUPABASE_SERVICE_ROLE_KEY)' };
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();
    // Look up the auth user by email (page size up to 1000)
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    if (listError) {
      return { success: false, error: `Failed to list auth users: ${listError.message}` };
    }

    const authUsers = (usersData?.users || []).filter(
      (u: { email?: string }) => u.email?.toLowerCase() === trimmedEmail
    );
    if (authUsers.length === 0) {
      // No auth user with this email — nothing to delete, consider it success
      return { success: true };
    }

    for (const user of authUsers) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        return { success: false, error: `Failed to delete auth user: ${deleteError.message}` };
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Unknown error deleting auth user') };
  }
}

/**
 * Permanently and completely remove an account from both Supabase Auth
 * and all related Supabase Postgres database tables (users, mothers, doctors, drivers).
 */
export async function deleteAccountCompletely(params: {
  email?: string;
  userId?: number | string;
  motherId?: number | string;
  doctorId?: number | string;
  driverId?: number | string;
}): Promise<{ success: boolean; error?: string }> {
  const { email, userId, motherId, doctorId, driverId } = params;
  const trimmedEmail = email ? email.trim() : undefined;

  try {
    // 1. Delete from Supabase Auth if email provided
    if (trimmedEmail && supabaseAdmin) {
      await deleteSupabaseAuthUser(trimmedEmail);
    }

    // 2. Delete from Supabase database tables using admin client (bypasses RLS) or standard client
    const client = supabaseAdmin || supabase;
    if (client) {
      if (motherId) {
        await client.from('mothers').delete().eq('id', motherId);
      }
      if (userId) {
        await client.from('mothers').delete().eq('user_id', userId);
        await client.from('users').delete().eq('id', userId);
      }
      if (trimmedEmail) {
        await client.from('users').delete().ilike('email', trimmedEmail);
      }
      if (doctorId) {
        await client.from('doctors').delete().eq('id', doctorId);
      }
      if (driverId) {
        await client.from('drivers').delete().eq('id', driverId);
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Unknown error during complete account deletion') };
  }
}


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
