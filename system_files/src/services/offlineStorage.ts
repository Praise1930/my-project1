// MamaTrack GPS — Offline Storage & Queue Management Service

export interface OfflineEmergencyRecord {
  id: string;
  mother_id: string;
  latitude: number;
  longitude: number;
  notes?: string;
  created_at: string;
  status: 'pending_sync' | 'synced';
}

const STORAGE_KEYS = {
  EMERGENCY_QUEUE: 'mamatrack_offline_emergencies',
  CHECKUP_CACHE: 'mamatrack_offline_checkups',
  VITALS_CACHE: 'mamatrack_offline_vitals'
};

export const OfflineStorageService = {
  /**
   * Queue an emergency alert locally when offline
   */
  queueEmergency(record: Omit<OfflineEmergencyRecord, 'status'>): OfflineEmergencyRecord {
    const queue = this.getQueuedEmergencies();
    const newRecord: OfflineEmergencyRecord = {
      ...record,
      status: 'pending_sync'
    };
    queue.push(newRecord);
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_QUEUE, JSON.stringify(queue));
    return newRecord;
  },

  /**
   * Get all queued offline emergencies
   */
  getQueuedEmergencies(): OfflineEmergencyRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMERGENCY_QUEUE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Remove a synced emergency from local offline queue
   */
  clearQueuedEmergency(id: string): void {
    const queue = this.getQueuedEmergencies().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_QUEUE, JSON.stringify(queue));
  },

  /**
   * Cache vital sign checks locally for rural offline VHT workflow
   */
  cacheVitals(motherId: string, vitals: Record<string, unknown>): void {
    const raw = localStorage.getItem(STORAGE_KEYS.VITALS_CACHE) || '{}';
    try {
      const cache = JSON.parse(raw);
      cache[motherId] = { vitals, timestamp: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.VITALS_CACHE, JSON.stringify(cache));
    } catch {
      // ignore JSON parse error
    }
  }
};
