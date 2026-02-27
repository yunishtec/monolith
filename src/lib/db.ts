
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'monolith_sonic_core';
const STORE_NAME = 'tracks';

export interface StoredTrack {
    id: string;
    name: string;
    data: ArrayBuffer;
    type: string;
    artist: string;
    albumArt?: string;
}

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

export const saveTrack = async (track: StoredTrack) => {
    const db = await initDB();
    await db.put(STORE_NAME, track);
};

export const getTracks = async (): Promise<StoredTrack[]> => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};

export const deleteTrack = async (id: string) => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};
