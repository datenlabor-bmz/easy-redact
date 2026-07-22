'use client'

import { openDB, type IDBPDatabase } from 'idb'
import type { Session, ChatMessage } from '@/types'

const DB_NAME = 'easy-redact'
const DB_VERSION = 1

type EasyRedactDB = {
  files: { key: string; value: { key: string; name: string; data: ArrayBuffer } }
  session: { key: string; value: Session }
  chat: { key: string; value: { id: string; messages: ChatMessage[] } }
}

let dbPromise: Promise<IDBPDatabase<EasyRedactDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EasyRedactDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('files', { keyPath: 'key' })
        db.createObjectStore('session', { keyPath: 'id' })
        db.createObjectStore('chat', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

// ── Files ─────────────────────────────────────────────────────────────────────

export async function saveFile(key: string, name: string, data: ArrayBuffer) {
  const db = await getDB()
  await db.put('files', { key, name, data })
}

export async function loadFile(key: string): Promise<ArrayBuffer | undefined> {
  const db = await getDB()
  const record = await db.get('files', key)
  return record?.data
}

export async function deleteFile(key: string) {
  const db = await getDB()
  await db.delete('files', key)
}

// ── Session ───────────────────────────────────────────────────────────────────

const SESSION_ID = 'current'

const DEFAULT_SESSION: Session = {
  id: SESSION_ID,
  documents: [],
  redactions: [],
  aiMode: 'local',
  redactionMode: 'pii',
}

export async function loadSession(): Promise<Session> {
  const db = await getDB()
  const raw = (await db.get('session', SESSION_ID)) ?? DEFAULT_SESSION
  // Migrate old 'consent' field to 'aiMode'
  if ('consent' in raw && !('aiMode' in raw)) {
    const { consent, ...rest } = raw as Session & { consent?: string }
    return { ...rest, aiMode: (consent as Session['aiMode']) ?? 'local' }
  }
  return raw
}

export async function saveSession(session: Session) {
  const db = await getDB()
  let createdAt = session.createdAt
  if (!session.documents.length) {
    createdAt = undefined // empty session: retention clock resets
  } else if (!createdAt) {
    // Keep an earlier stamp if one exists (the in-memory session may lag behind the DB)
    createdAt = (await db.get('session', SESSION_ID))?.createdAt ?? new Date().toISOString()
  }
  await db.put('session', { ...session, createdAt })
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function loadChat(): Promise<ChatMessage[]> {
  const db = await getDB()
  const record = await db.get('chat', SESSION_ID)
  return record?.messages ?? []
}

export async function saveChat(messages: ChatMessage[]) {
  const db = await getDB()
  await db.put('chat', { id: SESSION_ID, messages })
}

// ── Retention ─────────────────────────────────────────────────────────────────

// Stored data is kept for at most 6 months, counted from when the first document
// was added to an empty session (Session.createdAt). Enforced lazily: this check
// runs once on app load, since a browser app cannot delete data in the background.
const RETENTION_MONTHS = 6

function isExpired(iso: string): boolean {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS)
  return new Date(iso).getTime() < cutoff.getTime()
}

/** Delete stored data older than the retention period. Call before loading the session. */
export async function purgeExpiredData() {
  const db = await getDB()
  const session = await db.get('session', SESSION_ID)
  if (session?.documents.length) {
    if (!session.createdAt) {
      // Data stored before retention was introduced: start the clock now
      await db.put('session', { ...session, createdAt: new Date().toISOString() })
    } else if (isExpired(session.createdAt)) {
      await clearAll()
      return
    }
  }
  // Chat can outlive the documents; expire it based on its oldest message
  const chat = await db.get('chat', SESSION_ID)
  const oldest = chat?.messages[0]?.timestamp
  if (oldest && isExpired(oldest)) await db.delete('chat', SESSION_ID)
}

export async function clearAll() {
  const db = await getDB()
  const tx = db.transaction(['files', 'session', 'chat'], 'readwrite')
  await Promise.all([
    tx.objectStore('files').clear(),
    tx.objectStore('session').clear(),
    tx.objectStore('chat').clear(),
    tx.done,
  ])
}
