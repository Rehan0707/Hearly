/**
 * Encrypted IndexedDB Database Facade for Hearly v2 Meeting Memory.
 * Uses Web Crypto AES-GCM to transparently encrypt and decrypt stored meeting transcripts, summaries, decisions, and action items.
 */

export interface MeetingRecord {
  id: string;
  title: string;
  timestamp: number;
  durationSeconds: number;
  platform: 'meet' | 'zoom' | 'teams' | 'other';
  transcript: Array<{
    id: string;
    speaker: string;
    text: string;
    timestamp: number;
    isEnrolledUser: boolean;
  }>;
  summary: string;
  actionItems: string[];
  decisions: string[];
  questions: string[];
  embedding?: number[];
}

const DB_NAME = 'HearlyEncryptedDB';
const DB_VERSION = 1;
const STORE_MEETINGS = 'meetings';
const STORE_KEYS = 'crypto_keys';

export class EncryptedMeetingDb {
  private dbPromise: Promise<IDBDatabase>;
  private cryptoKey: CryptoKey | null = null;

  constructor() {
    this.dbPromise = this.initDb();
  }

  private initDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MEETINGS)) {
          db.createObjectStore(STORE_MEETINGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_KEYS)) {
          db.createObjectStore(STORE_KEYS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getOrCreateCryptoKey(): Promise<CryptoKey> {
    if (this.cryptoKey) return this.cryptoKey;

    const db = await this.dbPromise;
    const existing = await new Promise<any>((resolve) => {
      const tx = db.transaction(STORE_KEYS, 'readonly');
      const req = tx.objectStore(STORE_KEYS).get('primary_key');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (existing && existing.rawKey) {
      this.cryptoKey = await crypto.subtle.importKey(
        'jwk',
        existing.rawKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      return this.cryptoKey;
    }

    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const jwk = await crypto.subtle.exportKey('jwk', key);

    const tx = db.transaction(STORE_KEYS, 'readwrite');
    tx.objectStore(STORE_KEYS).put({ id: 'primary_key', rawKey: jwk });

    this.cryptoKey = key;
    return key;
  }

  private async encryptPayload(data: object): Promise<{ iv: number[]; cipherText: number[] }> {
    const key = await this.getOrCreateCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const jsonStr = JSON.stringify(data);
    const encoded = new TextEncoder().encode(jsonStr);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return {
      iv: Array.from(iv),
      cipherText: Array.from(new Uint8Array(encryptedBuffer)),
    };
  }

  private async decryptPayload(iv: number[], cipherText: number[]): Promise<any> {
    const key = await this.getOrCreateCryptoKey();
    const ivArray = new Uint8Array(iv);
    const cipherArray = new Uint8Array(cipherText);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      cipherArray
    );

    const jsonStr = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(jsonStr);
  }

  public async saveMeeting(meeting: MeetingRecord): Promise<void> {
    const db = await this.dbPromise;
    const encrypted = await this.encryptPayload(meeting);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEETINGS, 'readwrite');
      tx.objectStore(STORE_MEETINGS).put({
        id: meeting.id,
        timestamp: meeting.timestamp,
        payload: encrypted,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllMeetings(): Promise<MeetingRecord[]> {
    const db = await this.dbPromise;

    const rawRecords = await new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction(STORE_MEETINGS, 'readonly');
      const req = tx.objectStore(STORE_MEETINGS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const meetings: MeetingRecord[] = [];
    for (const record of rawRecords) {
      try {
        if (record.payload) {
          const decrypted = await this.decryptPayload(record.payload.iv, record.payload.cipherText);
          meetings.push(decrypted);
        }
      } catch (err) {
        console.error(`[Hearly DB] Failed to decrypt meeting ${record.id}:`, err);
      }
    }

    return meetings.sort((a, b) => b.timestamp - a.timestamp);
  }

  public async deleteMeeting(meetingId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEETINGS, 'readwrite');
      tx.objectStore(STORE_MEETINGS).delete(meetingId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
