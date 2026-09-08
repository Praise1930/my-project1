// MamaTrack GPS — Supabase Client & Connection Service
import { createClient } from '@supabase/supabase-js';
import { errorMessage } from './errors';

const FALLBACK_SUPABASE_URL = 'https://tdomiogiabjomkhjkres.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb21pb2dpYWJqb21raGprcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTEwNjksImV4cCI6MjEwMDY4NzA2OX0.gBVxScPK_BFdrXPW-ib2sxQ2ZZ0bebPCHvLhxwjiGOs';
const FALLBACK_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkb21pb2dpYWJqb21raGprcmVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTExMTA2OSwiZXhwIjoyMTAwNjg3MDY5fQ.xNBI1uxUYJMVbJgO8_eDucrqvEt64DBEJJP_0g0CRQQ';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY).trim();
const supabaseServiceRoleKey = (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SUPABASE_SERVICE_ROLE_KEY).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

/**
 * The production domain this app is served from. Supabase is configured with
 * this as its Site URL, and it is the only Vercel host without deployment
 * protection in front of it.
 */
export const CANONICAL_APP_ORIGIN = 'https://my-project1-peach.vercel.app';

/**
 * True for a Vercel host that is NOT the production alias — a branch preview
 * (`…-git-<branch>-<scope>.vercel.app`) or a per-deployment URL
 * (`…-<hash>-<scope>.vercel.app`).
 *
 * These hosts sit behind Vercel Deployment Protection, so a verification link
 * pointing at one opens Vercel's own SSO sign-in page instead of the MamaTrack
 * mothers' portal. A mother has no Vercel account, so the link is a dead end
 * for her — which is exactly the bug this guards against.
 */
function isProtectedVercelPreviewHost(hostname: string): boolean {
  if (!hostname.endsWith('.vercel.app')) return false;
  return hostname !== new URL(CANONICAL_APP_ORIGIN).hostname;
}

/**
 * Returns the canonical origin URL for this deployment — the origin every
 * Supabase auth email (sign-up confirmation, password reset) must point back to.
 *
 * Order of preference:
 *   1. VITE_APP_URL, when set. This is the explicit override and should match
 *      the Supabase "Site URL" exactly.
 *   2. window.location.origin — but only when it is safe to link back to:
 *      localhost and LAN dev servers, and the production Vercel alias.
 *   3. CANONICAL_APP_ORIGIN, used whenever the current page is being served
 *      from a protected Vercel preview/deployment URL.
 *
 * The previous implementation returned window.location.origin unconditionally
 * and only consulted VITE_APP_URL when there was no window at all, so
 * registering on any preview deployment produced a confirmation email whose
 * link landed on the Vercel login page.
 */
export function getAppOrigin(): string {
  const envUrl = (import.meta.env.VITE_APP_URL || '').trim().replace(/\/+$/, '');
  if (envUrl.startsWith('http')) return envUrl;

  if (typeof window !== 'undefined' && window.location?.origin?.startsWith('http')) {
    const { origin, hostname } = window.location;
    if (!isProtectedVercelPreviewHost(hostname)) return origin;
  }

  return CANONICAL_APP_ORIGIN;
}

/**
 * Builds the URL a Supabase confirmation email should return the user to.
 * Always the role's own login portal, pre-filled with the address that was
 * verified, so a mother lands on the mothers' sign-in form and nowhere else.
 *
 * Note: Supabase silently falls back to the project's Site URL when the
 * redirect is not on its allow-list, so this origin must also be listed under
 * Authentication -> URL Configuration -> Redirect URLs.
 */
export function buildVerifyRedirectUrl(email: string, role: string = 'mother'): string {
  return `${getAppOrigin()}/login?role=${encodeURIComponent(role)}&verified=true&email=${encodeURIComponent(email)}`;
}

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
 * Confirms a user's email in Supabase Auth directly using admin API.
 * Marks email_confirm: true so the user can immediately log in without needing
 * to click email links.
 */
export async function confirmSupabaseAuthUser(email: string): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Admin client not configured' };
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    if (listError) return { success: false, error: listError.message };

    const user = (usersData?.users || []).find(
      (u: { email?: string }) => u.email?.toLowerCase() === trimmedEmail
    );
    if (!user) return { success: false, error: 'Account not found in Supabase Auth' };

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });
    if (updateError) return { success: false, error: updateError.message };

    return { success: true };
  } catch (err) {
    return { success: false, error: errorMessage(err, 'Could not confirm auth user') };
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
