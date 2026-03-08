import { pipeline as _pipeline, type TokenClassificationPipeline, type TokenClassificationOutput } from '@huggingface/transformers'
import * as Comlink from 'comlink'

export interface NerEntity {
  text: string
  type: string
  score: number
  startIndex: number
  endIndex: number
}

export type ProgressEvent =
  | { status: 'initiate' | 'download' | 'done'; file: string }
  | { status: 'progress'; file: string; progress: number }
  | { status: 'ready' }

let classifier: TokenClassificationPipeline | null = null

function findAndAddEntity(entity: { text: string; type: string; score: number }, originalText: string, entities: NerEntity[]) {
  if (!entity.text) return
  const startPos = originalText.indexOf(entity.text)
  if (startPos !== -1)
    entities.push({ ...entity, startIndex: startPos, endIndex: startPos + entity.text.length })
}

function decodeBIO(output: TokenClassificationOutput, originalText: string): NerEntity[] {
  const entities: NerEntity[] = []
  let cur: { text: string; type: string; score: number; words: string[]; rawWords: string[] } | null = null

  const flush = () => { if (cur) { findAndAddEntity(cur, originalText, entities); cur = null } }

  for (const token of output) {
    const clean = token.word.replace('##', '')

    if (token.entity === 'O') { flush(); continue }

    if (token.entity.startsWith('B-')) {
      flush()
      cur = { text: clean, type: token.entity.slice(2), score: token.score, words: [clean], rawWords: [token.word] }
    } else if (token.entity.startsWith('I-') && cur) {
      cur.words.push(clean)
      cur.rawWords.push(token.word)

      const reconstructions = [
        cur.words.join(''),
        cur.words.join(' '),
        cur.rawWords.reduce((t, w, i) => i === 0 ? w : t + (w.startsWith('##') ? w.slice(2) : ' ' + w), ''),
        cur.words.reduce((t, w) => {
          const joined = t + w, spaced = t + ' ' + w
          return originalText.includes(joined) ? joined : originalText.includes(spaced) ? spaced : t
        }, cur.words[0]),
      ]

      for (const r of reconstructions)
        if (originalText.includes(r) && r.length > (cur.text?.length ?? 0))
          cur.text = r

      cur.score = Math.min(cur.score, token.score)
    }
  }
  flush()
  return entities.sort((a, b) => a.startIndex - b.startIndex)
}

const MODEL = 'Xenova/bert-base-multilingual-cased-ner-hrl'

async function loadModel(onProgress: (e: ProgressEvent) => void) {
  if (classifier) { onProgress({ status: 'ready' }); return }
  const device = (navigator as Navigator & { gpu?: unknown }).gpu ? 'webgpu' : 'wasm'
  const dtype = device === 'webgpu' ? 'fp16' : 'q8'
  const fileProgress = new Map<string, number>()
  let lastReported = -1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  classifier = await (_pipeline as any)('token-classification', MODEL, {
    device, dtype,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progress_callback: (e: any) => {
      if (e.status === 'progress' && e.file) {
        fileProgress.set(e.file, e.progress ?? 0)
        const vals = [...fileProgress.values()]
        const agg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        if (agg > lastReported) { lastReported = agg; onProgress({ status: 'progress', file: e.file, progress: agg }) }
      } else if (e.status === 'initiate' && e.file) {
        fileProgress.set(e.file, 0)
        onProgress(e)
      } else {
        onProgress(e)
      }
    },
  }) as TokenClassificationPipeline
  onProgress({ status: 'ready' })
}

async function analyzePages(
  pages: { pageIndex: number; text: string }[],
  onPageDone: (pageIndex: number, entities: NerEntity[]) => void,
) {
  if (!classifier) throw new Error('Model not loaded')
  for (const { pageIndex, text } of pages) {
    if (!text.trim()) { onPageDone(pageIndex, []); continue }
    const output = await classifier(text, { ignore_labels: [] }) as TokenClassificationOutput
    onPageDone(pageIndex, decodeBIO(output, text))
  }
}

Comlink.expose({ loadModel, analyzePages })
