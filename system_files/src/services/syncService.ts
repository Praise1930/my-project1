// MamaTrack GPS — Supabase Realtime Synchronization Service
//
// Bridges the per-device localStorage cache with a shared Supabase Postgres
// database so that an SOS raised on a mother's phone appears immediately on the
// admin's desktop, the driver's phone and the doctor's console.
//
// Direction 1 (push): db.setStore() -> syncLocalChange() -> supabase.upsert()
// Direction 2 (pull): supabase realtime -> applyRemoteRow() -> localStorage + UI event
//
// Remote rows are written straight to localStorage rather than through the `db`
// setters. That is deliberate: going through the setters would re-enter
// setStore() and echo the row back to Supabase, producing an endless write loop.

import { supabase, isSupabaseConfigured } from './supabase';
import { errorMessage } from './errors';
import { OfflineStorageService } from './offlineStorage';

/** A synced record. Every synced table keys on `id`; the rest is table-specific. */
export type SyncedRow = Record<string, unknown> & { id: string | number };

/** Shape of the realtime payload we consume from `postgres_changes`. */
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: SyncedRow;
  old?: SyncedRow;
}

// Custom event that tells React views to re-read localStorage.
export const DB_UPDATE_EVENT = 'mamatrack_db_update';

// localStorage suffix -> Supabase table name.
// The keys here are the exact keys db.ts passes to setStore(), which is why they
// are snake_case strings rather than the camelCase `db` accessors.
export const SYNCED_TABLES: Record<string, string> = {
  users: 'users',
  hospitals: 'hospitals',
  vehicles: 'vehicles',
  mothers: 'mothers',
  doctors: 'doctors',
  drivers: 'drivers',
  emergencies: 'emergencies',
  emergency_logs: 'emergency_logs',
  notifications: 'notifications',
  vitals: 'vitals',
  vht_visits: 'vht_visits',
};

interface SyncQueueItem {
  storeKey: string;
  id: string;
  data: SyncedRow;
  timestamp: number;
}

const QUEUE_KEY = 'mamatrack_sync_queue';

function readLocal(storeKey: string): SyncedRow[] {
  const raw = localStorage.getItem(`mamatrack_${storeKey}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The queue is user-writable localStorage, so a corrupt or hand-edited value must
// not throw — that would abort the flush and strand every queued offline edit.
function readQueue(): SyncQueueItem[] {
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('SyncService: offline queue was corrupt and has been reset.');
    localStorage.removeItem(QUEUE_KEY);
    return [];
  }
}

// Write without going through db's setters, so no outbound sync is re-triggered.
function writeLocalSilently(storeKey: string, list: SyncedRow[]): void {
  localStorage.setItem(`mamatrack_${storeKey}`, JSON.stringify(list));
}

function notifyViews(storeKey: string): void {
  window.dispatchEvent(new CustomEvent(DB_UPDATE_EVENT, { detail: { key: storeKey } }));
}

export const SyncService = {
  channel: null as ReturnType<NonNullable<typeof supabase>['channel']> | null,
  started: false,

  /** Subscribe to realtime changes and pull a baseline snapshot. */
  init() {
    if (!isSupabaseConfigured || !supabase) {
      console.warn(
        'SyncService: Supabase is not configured — running in LOCAL-ONLY mode. ' +
        'Emergencies raised on one device will NOT reach other devices. ' +
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cross-device sync.'
      );
      return;
    }
    if (this.started) return;
    this.started = true;

    console.log('SyncService: connecting to Supabase realtime…');

    // Realtime only delivers changes that happen *after* subscribing, so pull
    // current state first — otherwise a device opened mid-emergency sees nothing.
    this.pullAll();

    // Local alias so the null-narrowing above survives into the callbacks below.
    const client = supabase;

    try {
      // The Supabase client caches channels by topic and outlives this module
      // (module re-evaluation on HMR, or a second init after a hot reload). A
      // cached channel is already subscribed, and .on() after subscribe() throws
      // — which, unhandled, takes <App> down with it. Drop any stale channel of
      // this name before building a fresh one.
      client
        .getChannels()
        .filter((ch) => ch.topic === 'realtime:mamatrack-sync')
        .forEach((ch) => client.removeChannel(ch));

      const channel = client.channel('mamatrack-sync');
      Object.keys(SYNCED_TABLES).forEach((storeKey) => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: SYNCED_TABLES[storeKey] },
          (payload) => this.applyRemoteRow(storeKey, payload as unknown as RealtimePayload)
        );
      });

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('SyncService: realtime channel live — cross-device sync active.');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(
            `SyncService: realtime channel status "${status}". Check that Realtime is ` +
            'enabled for these tables in Supabase.'
          );
        }
      });
      this.channel = channel;
    } catch (err) {
      // Losing realtime degrades the app to poll-and-queue sync; it must never
      // stop an SOS from being raised, so this is warned about, not thrown.
      console.warn(
        'SyncService: realtime subscription failed — continuing without live push. ' +
        errorMessage(err)
      );
      this.channel = null;
    }

    window.addEventListener('online', () => this.flushOfflineQueue());
    if (navigator.onLine) this.flushOfflineQueue();
  },

  /** Fetch every synced table once so this device starts from shared state. */
  async pullAll() {
    if (!supabase) return;

    for (const storeKey of Object.keys(SYNCED_TABLES)) {
      try {
        const { data, error } = await supabase.from(SYNCED_TABLES[storeKey]).select('*');
        if (error) {
          console.warn(`SyncService: initial pull of "${storeKey}" failed:`, error.message);
          continue;
        }
        if (!data || data.length === 0) continue;

        // Remote wins for rows that exist on both sides; purely-local rows are kept
        // so unsynced offline work is not silently discarded.
        const merged = new Map<string, SyncedRow>();
        readLocal(storeKey).forEach((row) => merged.set(String(row.id), row));
        (data as SyncedRow[]).forEach((row) => merged.set(String(row.id), row));

        writeLocalSilently(storeKey, Array.from(merged.values()));
        notifyViews(storeKey);
      } catch (err) {
        console.warn(`SyncService: initial pull of "${storeKey}" threw:`, errorMessage(err));
      }
    }
  },

  /** Merge a single realtime row change into the local cache. */
  applyRemoteRow(storeKey: string, payload: RealtimePayload) {
    const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
    if (!row || row.id === undefined || row.id === null) return;

    const list = readLocal(storeKey);
    const idx = list.findIndex((item) => String(item.id) === String(row.id));

    if (payload.eventType === 'DELETE') {
      if (idx === -1) return;
      list.splice(idx, 1);
    } else if (idx === -1) {
      list.push(row);
    } else {
      // Skip no-op echoes of our own write to avoid needless re-renders.
      if (JSON.stringify(list[idx]) === JSON.stringify(row)) return;
      list[idx] = row;
    }

    writeLocalSilently(storeKey, list);
    notifyViews(storeKey);
    console.log(`SyncService: applied remote ${payload.eventType} on "${storeKey}/${row.id}".`);
  },

  /** Push one locally-changed record up to Supabase. */
  async syncLocalChange(storeKey: string, id: string | number, data: SyncedRow) {
    const table = SYNCED_TABLES[storeKey];
    if (!table) return; // table is intentionally device-local (e.g. sms_logs)

    const stringId = String(id);

    if (!isSupabaseConfigured || !supabase || !navigator.onLine) {
      this.enqueueOfflineChange(storeKey, stringId, data);
      return;
    }

    try {
      const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
      if (error) {
        console.warn(`SyncService: upsert "${table}/${stringId}" failed:`, error.message);
        this.enqueueOfflineChange(storeKey, stringId, data);
      }
    } catch (err) {
      console.warn(`SyncService: upsert "${table}/${stringId}" threw:`, errorMessage(err));
      this.enqueueOfflineChange(storeKey, stringId, data);
    }
  },

  /** Hold a change locally until connectivity returns. */
  enqueueOfflineChange(storeKey: string, id: string, data: SyncedRow) {
    const queue = readQueue();
    // Drop older edits of the same row — only the newest state matters.
    const filtered = queue.filter(item => !(item.storeKey === storeKey && item.id === id));
    filtered.push({ storeKey, id, data, timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  /** Replay queued offline edits once back online. */
  async flushOfflineQueue() {
    if (!isSupabaseConfigured || !supabase || !navigator.onLine) return;

    const queue = readQueue();
    if (queue.length === 0) return;

    console.log(`SyncService: flushing ${queue.length} queued edit(s) to Supabase…`);
    const remaining: SyncQueueItem[] = [];

    for (const item of queue) {
      const table = SYNCED_TABLES[item.storeKey];
      if (!table) continue;
      try {
        const { error } = await supabase.from(table).upsert(item.data, { onConflict: 'id' });
        if (error) {
          remaining.push(item);
        } else if (item.storeKey === 'emergencies') {
          // The alert has reached the server, so drop the local "held" copy the
          // mother's screen shows. Anything still listed there is genuinely
          // unsent.
          OfflineStorageService.clearQueuedEmergency(item.id);
        }
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

    if (remaining.length === 0) {
      window.dispatchEvent(new CustomEvent(DB_UPDATE_EVENT, { detail: { key: 'emergencies' } }));
    }
  },
};
