// MamaTrack GPS — Firestore Synchronization Service
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';
import { db } from './db';

// Custom event to trigger React components update when remote DB shifts
export const DB_UPDATE_EVENT = 'mamatrack_db_update';

interface SyncQueueItem {
  collectionName: string;
  id: string;
  data: any;
  timestamp: number;
}

export const SyncService = {
  activeListeners: [] as (() => void)[],

  // Initialize real-time synchronization listeners
  init() {
    if (!isFirebaseConfigured || !firestore) {
      console.log('SyncService: Firebase is not configured, running in local-only mode.');
      return;
    }

    console.log('SyncService: Initializing real-time Firestore synchronization...');
    
    // 1. Setup listeners for Collections to sync cloud changes to LocalStorage
    this.listenToCollection('emergencies', 'emergencies');
    this.listenToCollection('vitals', 'vitals');
    this.listenToCollection('vht_visits', 'vht_visits');
    this.listenToCollection('users', 'users');

    // 2. Setup network recovery queue dispatcher
    window.addEventListener('online', () => this.flushOfflineQueue());
    if (navigator.onLine) {
      this.flushOfflineQueue();
    }
  },

  // Listen to a Firestore collection and merge changes into LocalStorage
  listenToCollection(firestoreColl: string, dbKey: string) {
    try {
      const collRef = collection(firestore, firestoreColl);
      const unsubscribe = onSnapshot(collRef, (snapshot) => {
        let changed = false;
        const localList = (db as any)[dbKey] || [];
        const localMap = new Map(localList.map((item: any) => [String(item.id), item]));

        snapshot.docChanges().forEach((change) => {
          const remoteData = change.doc.data();
          const docId = change.doc.id;

          if (change.type === 'added' || change.type === 'modified') {
            const existing = localMap.get(docId);
            // Check if remote data differs from local cache
            if (JSON.stringify(existing) !== JSON.stringify(remoteData)) {
              localMap.set(docId, remoteData);
              changed = true;
            }
          }
        });

        if (changed) {
          const newList = Array.from(localMap.values());
          (db as any)[dbKey] = newList;
          
          // Dispatch global custom event to trigger state updates in React views
          window.dispatchEvent(new CustomEvent(DB_UPDATE_EVENT, { detail: { key: dbKey } }));
          console.log(`SyncService: Merged cloud update for "${dbKey}"`);
        }
      }, (error) => {
        console.warn(`SyncService listener error on "${firestoreColl}":`, error);
      });

      this.activeListeners.push(unsubscribe);
    } catch (e) {
      console.warn(`SyncService: Failed to setup listener for "${firestoreColl}":`, e);
    }
  },

  // Sync a local mutation directly to Firestore
  async syncLocalChange(collectionName: string, id: string | number, data: any) {
    const stringId = String(id);

    // Save to offline queue if client is offline or Firebase isn't configured
    if (!isFirebaseConfigured || !firestore || !navigator.onLine) {
      this.enqueueOfflineChange(collectionName, stringId, data);
      return;
    }

    try {
      const docRef = doc(firestore, collectionName, stringId);
      await setDoc(docRef, data, { merge: true });
      console.log(`SyncService: Successfully synced "${collectionName}/${stringId}" to cloud.`);
    } catch (error) {
      console.warn(`SyncService: Failed to sync "${collectionName}/${stringId}". Queueing locally.`, error);
      this.enqueueOfflineChange(collectionName, stringId, data);
    }
  },

  // Queue a change in localStorage for offline execution
  enqueueOfflineChange(collectionName: string, id: string, data: any) {
    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('mamatrack_sync_queue') || '[]');
    
    // Remove previous edits of the same document to avoid duplicate writes
    const filteredQueue = queue.filter(item => !(item.collectionName === collectionName && item.id === id));
    
    const newItem: SyncQueueItem = {
      collectionName,
      id,
      data,
      timestamp: Date.now()
    };

    localStorage.setItem('mamatrack_sync_queue', JSON.stringify([...filteredQueue, newItem]));
    console.log(`SyncService: Queued "${collectionName}/${id}" locally (Offline mode).`);
  },

  // Flush all offline edits when client returns online
  async flushOfflineQueue() {
    if (!isFirebaseConfigured || !firestore || !navigator.onLine) return;

    const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem('mamatrack_sync_queue') || '[]');
    if (queue.length === 0) return;

    console.log(`SyncService: Flushing ${queue.length} offline edits to cloud...`);
    const remainingQueue: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        const docRef = doc(firestore, item.collectionName, item.id);
        await setDoc(docRef, item.data, { merge: true });
        console.log(`SyncService: Flushed offline item "${item.collectionName}/${item.id}"`);
      } catch (err) {
        console.warn(`SyncService: Re-queueing failed flush "${item.collectionName}/${item.id}":`, err);
        remainingQueue.push(item);
      }
    }

    localStorage.setItem('mamatrack_sync_queue', JSON.stringify(remainingQueue));
  }
};
