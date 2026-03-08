import * as Comlink from 'comlink'
import type { Remote } from 'comlink'
import type { NerEntity, ProgressEvent } from './browser-nlp.worker'
import type { RedactionSuggestion } from '@/types'

export type { ProgressEvent }

export type ModelStatus = 'idle' | 'downloading' | 'loading' | 'ready' | 'error'

interface WorkerApi {
  loadModel(onProgress: (e: ProgressEvent) => void): Promise<void>
  analyzePages(
    pages: { pageIndex: number; text: string }[],
    onPageDone: (pageIndex: number, entities: NerEntity[]) => void,
  ): Promise<void>
}

const NER_REASON: Record<string, string> = { PER: 'Erkannte Entität: PER', ORG: 'Erkannte Entität: ORG', LOC: 'Erkannte Entität: LOC' }
const NER_GROUP: Record<string, string> = { PER: 'Personen', ORG: 'Organisationen', LOC: 'Orte' }
const NER_CONFIDENCE: Record<string, 'high' | 'low'> = { PER: 'high', ORG: 'low', LOC: 'low' }

let worker: Remote<WorkerApi> | null = null

function getWorker(): Remote<WorkerApi> {
  if (!worker) {
    const raw = new Worker(new URL('./browser-nlp.worker', import.meta.url), { type: 'module' })
    worker = Comlink.wrap<WorkerApi>(raw)
  }
  return worker
}

export async function loadBrowserNlpModel(onProgress: (e: ProgressEvent) => void) {
  await getWorker().loadModel(Comlink.proxy(onProgress))
}

export async function analyzePagesInBrowser(
  pages: { pageIndex: number; text: string }[],
  onPageDone?: (pageIndex: number, suggestions: RedactionSuggestion[]) => void,
): Promise<RedactionSuggestion[]> {
  const all: RedactionSuggestion[] = []
  await getWorker().analyzePages(
    pages,
    Comlink.proxy((pageIndex: number, entities: NerEntity[]) => {
      const suggestions = entities.map(e => ({
        text: e.text,
        pageIndex,
        confidence: NER_CONFIDENCE[e.type] ?? ('low' as const),
        personGroup: NER_GROUP[e.type] ?? e.type,
        reason: NER_REASON[e.type] ?? `Erkannte Entität: ${e.type}`,
      }))
      all.push(...suggestions)
      onPageDone?.(pageIndex, suggestions)
    }),
  )
  return all
}
