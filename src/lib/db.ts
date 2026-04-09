import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { type Capture } from '../types';

interface SmileVisionDB extends DBSchema {
  captures: {
    key: string;
    value: Capture;
    indexes: { 
      'by-timestamp': number;
      'by-sync-status': string;
      'by-session': string;
    };
  };
}

const DB_NAME = 'smilevision-pro';
const STORE_NAME = 'captures';

export async function initDB(): Promise<IDBPDatabase<SmileVisionDB>> {
  return openDB<SmileVisionDB>(DB_NAME, 3, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
        store.createIndex('by-timestamp', 'timestamp');
      }
      if (oldVersion < 2) {
        const store = transaction.objectStore(STORE_NAME);
        store.createIndex('by-sync-status', 'sync_status');
      }
      if (oldVersion < 3) {
        const store = transaction.objectStore(STORE_NAME);
        store.createIndex('by-session', 'id_session');
      }
    },
  });
}

export async function getCapturesBySession(sessionId: string): Promise<Capture[]> {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by-session', sessionId);
}

export async function saveCapture(capture: Capture) {
  const db = await initDB();
  await db.put(STORE_NAME, capture);
}

export async function getAllCaptures(): Promise<Capture[]> {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by-timestamp');
}

export async function deleteCapture(id: string) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function updateCapture(capture: Capture) {
  const db = await initDB();
  await db.put(STORE_NAME, capture);
}
