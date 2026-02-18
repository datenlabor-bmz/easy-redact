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
  consent: null,
  redactionMode: 'pii',
  modelSettings: {
    cloudDeployment: 'gpt-5.2',
    localBase: '',
    localModel: 'llama3.3:latest',
  },
}

export async function loadSession(): Promise<Session> {
  const db = await getDB()
  return (await db.get('session', SESSION_ID)) ?? DEFAULT_SESSION
}

export async function saveSession(session: Session) {
  const db = await getDB()
  await db.put('session', session)
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
