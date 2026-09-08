// MamaTrack GPS — Supabase Client & Connection Service
import { createClient } from '@supabase/supabase-js';
import { errorMessage } from './errors';

// The publishable ("anon") key is designed to ship in the browser bundle; it is
// the RLS policies behind it that protect data, not its secrecy.
//
// The service_role key is the opposite: it bypasses RLS entirely. It used to be
// hard-coded a few lines below this comment and was therefore compiled into the
// public JavaScript bundle, where anyone could read it straight out of the
// deployed site and read, alter or delete every patient record. It has been
// removed, and no privileged client is constructed in the browser any more.
// Anything genuinely needing service_role must run server-side (a Supabase Edge
// Function or a serverless route), never here.
const FALLBACK_SUPABASE_URL = 'https://tdomiogiabjomkhjkres.supabase.co';
// Supabase's modern publishable key. It replaces the legacy `anon` JWT, which is
// being disabled on this project: the legacy anon and service_role keys share a
// JWT secret, so retiring the leaked service_role key retires the anon key with
// it. A publishable key carries no privileges of its own — RLS policies decide
// what it can reach — so it is safe in the bundle, exactly as the anon key was.
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_QQoC5fJhUP51XrbROGz31Q_dOM3Uj9p';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY).trim();

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

/**
 * There is deliberately no admin client here.
 *
 * A service_role client cannot exist safely in a browser: whatever key it is
 * built from ends up in the bundle, and that key bypasses Row Level Security on
 * every table. The privileged operations below therefore report that they are
 * unavailable rather than quietly re-introducing the exposure. Implement them
 * as a Supabase Edge Function holding the key server-side and call that instead.
 */
const ADMIN_UNAVAILABLE =
  'This action needs Supabase admin privileges, which are not available from the browser. ' +
  'It must be performed from the Supabase dashboard or a server-side endpoint.';

/**
 * Delete a user from Supabase Auth by their email address.
 * This ensures re-registration with the same email works after admin deletion.
 * Requires the service_role key to be configured.
 */
export async function deleteSupabaseAuthUser(email: string): Promise<{ success: boolean; error?: string }> {
  // Deleting an Auth user requires service_role. Removing the row from the
  // `users` table (which deleteAccountCompletely still does) is enough for the
  // account to disappear from the app; the Auth identity has to be removed from
  // the Supabase dashboard, or by a server-side endpoint, so the same address
  // can be registered again.
  console.warn(`Supabase Auth deletion for "${email}" skipped: ${ADMIN_UNAVAILABLE}`);
  return { success: false, error: ADMIN_UNAVAILABLE };
}

/**
 * Confirms a user's email in Supabase Auth directly using admin API.
 * Marks email_confirm: true so the user can immediately log in without needing
 * to click email links.
 */
export async function confirmSupabaseAuthUser(email: string): Promise<{ success: boolean; error?: string }> {
  // Marking an address confirmed requires service_role. The confirmation link
  // in the sign-up email does the same job safely, and now that
  // buildVerifyRedirectUrl() points that link at the right origin it actually
  // works, so this shortcut is no longer the only way in.
  console.warn(`Supabase Auth confirmation for "${email}" skipped: ${ADMIN_UNAVAILABLE}`);
  return { success: false, error: ADMIN_UNAVAILABLE };
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
    // The Auth identity itself can only be removed with service_role, which is
    // deliberately absent from the browser. The database rows below are what the
    // app reads, so the account stops existing as far as MamaTrack is concerned;
    // clearing the leftover Auth identity is a dashboard/server-side step.
    let authRemoved = true;
    if (trimmedEmail) {
      const authResult = await deleteSupabaseAuthUser(trimmedEmail);
      authRemoved = authResult.success;
    }

    const client = supabase;
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

    if (!authRemoved) {
      return {
        success: true,
        error: 'Account records removed. The Supabase Auth identity remains and must be deleted ' +
               'from the Supabase dashboard before this email can be registered again.'
      };
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
