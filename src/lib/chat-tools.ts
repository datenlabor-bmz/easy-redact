import type { DocumentPage, RedactionSuggestion, TextRangeSuggestion, PageRangeSuggestion, AskUserQuestion, RedactionRule } from '@/types'
import { findFuzzyMatch } from '@/lib/text-match'

// ── Tool schemas for OpenAI function calling ───────────────────────────────────

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'ask_user',
      description: 'Ask the user a structured question with pre-defined answer options. Use this only for concrete ambiguities that arise from the actual document content (e.g. which category a specific person belongs to, whether a specific item should be treated as an exception). Never use this to ask about the redaction mode or which AI model to use — those are already chosen by the user in the UI. The UI will display clickable option chips.',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The question to ask' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
              },
              required: ['id', 'label'],
            },
          },
          allowFreeform: { type: 'boolean', description: 'Whether to also allow free-form text answer', default: true },
        },
        required: ['question', 'options'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'suggest_redactions',
      description: 'Suggest redactions for the documents. Only call this after you fully understand the user\'s requirements (redaction mode, categories, exceptions). Each suggestion must include the exact text string to search for.',
      parameters: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Exact text string to find and redact in the document' },
                pageIndex: { type: 'number', description: '0-based page index within that document' },
                confidence: { type: 'string', enum: ['high', 'low'], description: 'high = certain, low = ambiguous individual case' },
                person: { type: 'string', description: 'Name of the person or organisation this redaction belongs to — use the actual name (e.g. "Max Mustermann", "Diversifix e. V."), never leave empty' },
                personGroup: { type: 'string', description: 'Group category, e.g. "Privatpersonen", "Bundesbeamte", "Organisationen"' },
                reason: { type: 'string', description: 'Brief explanation why this should be redacted' },
                rule: { type: 'string', description: 'Exact title of the applicable FOI rule, copied verbatim from the system prompt (FOI mode only). Omit in PII mode or when no specific rule applies.' },
              },
              required: ['text', 'pageIndex', 'confidence', 'person'],
            },
          },
          textRanges: {
            type: 'array',
            description: 'Redact a continuous block of text spanning one or more pages. Use for paragraphs, sections, or appendices. Provide the first few words of the block as startText and the last few words as endText.',
            items: {
              type: 'object',
              properties: {
                startText: { type: 'string', description: 'Exact text at the START of the range (first few words)' },
                startPage: { type: 'number', description: '0-based page index where startText appears' },
                endText: { type: 'string', description: 'Exact text at the END of the range (last few words)' },
                endPage: { type: 'number', description: '0-based page index where endText appears (may equal startPage)' },
                confidence: { type: 'string', enum: ['high', 'low'] },
                person: { type: 'string', description: 'Person or organisation this range belongs to' },
                personGroup: { type: 'string', description: 'Group category' },
                reason: { type: 'string' },
                rule: { type: 'string', description: 'Exact title of the applicable FOI rule, copied verbatim from the system prompt (FOI mode only). Omit in PII mode or when no specific rule applies.' },
              },
              required: ['startText', 'startPage', 'endText', 'endPage', 'confidence', 'person'],
            },
          },
          pageRanges: {
            type: 'array',
            description: 'LAST RESORT — redact entire pages. Only use when the whole page is sensitive top to bottom (e.g. a full signature-list annex), verified against the actual read_documents text. If only part of a page needs redacting, use `suggestions` or `textRanges` for that part instead. Page indices come from the read_documents response (0-based).',
            items: {
              type: 'object',
              properties: {
                fromPage: { type: 'number', description: '0-based page index, inclusive start' },
                toPage: { type: 'number', description: '0-based page index, inclusive end' },
                confidence: { type: 'string', enum: ['high', 'low'] },
                person: { type: 'string' },
                personGroup: { type: 'string' },
                reason: { type: 'string' },
                rule: { type: 'string', description: 'Exact title of the applicable FOI rule, copied verbatim from the system prompt (FOI mode only). Omit in PII mode or when no specific rule applies.' },
              },
              required: ['fromPage', 'toPage', 'confidence', 'person'],
            },
          },
          remove: {
            type: 'array',
            description: 'IDs of existing suggested redactions to remove. Only redactions with status "suggested" can be removed. Use the IDs from the current redaction snapshot provided in the system context.',
            items: { type: 'string' },
          },
        },
        required: ['suggestions'],
      },
    },
  },
]

// The read_documents tool is only added to the schema when consent is given
export const readDocumentsTool = {
  type: 'function' as const,
  function: {
    name: 'read_documents',
    description: 'Read the text content of the current document. Only available after the user has granted document access consent.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
}

// ── Tool executors ─────────────────────────────────────────────────────────────

export type ToolResult = { success: true; data: unknown } | { success: false; error: string }

// Special marker for tools that need to send custom SSE events
export type SpecialToolResult =
  | { type: 'ask_user'; question: AskUserQuestion }
  | { type: 'suggest_redactions'; suggestions: RedactionSuggestion[]; textRanges: TextRangeSuggestion[]; pageRanges: PageRangeSuggestion[]; remove: string[] }

export function executeAskUser(args: Record<string, unknown>): { special: SpecialToolResult; toolResult: ToolResult } {
  const question: AskUserQuestion = {
    question: args.question as string,
    options: args.options as AskUserQuestion['options'],
    allowFreeform: (args.allowFreeform as boolean) ?? true,
  }
  return {
    special: { type: 'ask_user', question },
    toolResult: { success: true, data: 'Question displayed to user. Waiting for response.' },
  }
}

// The model only sends the rule's title (as shown to it in the system prompt) rather
// than reconstructing the full {title, reference, group} object — much cheaper per
// suggestion, and the canonical rule (with reference/group/full_text/url) is looked
// up here instead. An unrecognised title still gets attached as a bare {title} so
// the suggestion is never silently dropped.
function resolveRule(title: unknown, foiRules?: RedactionRule[]): RedactionRule | undefined {
  if (typeof title !== 'string' || !title.trim()) return undefined
  const needle = title.trim().toLowerCase()
  return foiRules?.find(r => r.title.trim().toLowerCase() === needle) ?? { title: title.trim() }
}

const normalizeForSearch = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

// Small/local models occasionally send page numbers as a numeric string
// ("3") rather than a number, or apply 1-based counting despite the schema
// saying 0-based. Coercing rather than requiring a strict `number` avoids
// discarding an otherwise perfectly good suggestion over a typing quirk.
function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.trim())
    if (Number.isFinite(n)) return n
  }
  return undefined
}

// When pageIndex is missing or unparseable, the exact text is still enough to
// find which page it's actually on — the same way the client's own
// whole-document dedup search does. Falling back to that recovers a
// well-formed suggestion whose page number the model omitted or mistyped,
// instead of discarding it outright.
function inferPageIndex(text: string, documentPages?: DocumentPage[]): number | undefined {
  if (!documentPages?.length) return undefined
  const needle = normalizeForSearch(text)
  if (needle) {
    const exact = documentPages.find(p => normalizeForSearch(p.text).includes(needle))
    if (exact) return exact.pageIndex
  }
  const fuzzy = documentPages.find(p => findFuzzyMatch(p.text, text))
  return fuzzy?.pageIndex
}

// The model sometimes paraphrases or mistypes the text it claims to have read, and
// the browser can only redact strings it finds verbatim in the PDF. Checking each
// suggestion against the extracted page text turns that silent miss into feedback
// the model can act on. Comparison is deliberately lenient about whitespace and
// case so that only genuinely absent text is reported — and a fuzzy pass catches
// the near-misses (accents, "&" vs "and", a one-letter spelling slip) that the
// client already tolerates when it actually searches the PDF, so those aren't
// reported as problems here even though they aren't a byte-for-byte match.
function describeUnlocatable(suggestions: RedactionSuggestion[], documentPages?: DocumentPage[]): string[] {
  if (!documentPages?.length) return []
  const pages = documentPages.map(p => ({
    documentKey: p.documentKey,
    pageIndex: p.pageIndex,
    text: normalizeForSearch(p.text),
    rawText: p.text,
  }))

  const problems: string[] = []
  for (const s of suggestions) {
    const needle = normalizeForSearch(s.text ?? '')
    if (!needle) continue
    const onStatedPage = pages.some(p => p.pageIndex === s.pageIndex && p.text.includes(needle))
    if (onStatedPage) continue
    const elsewhere = pages.find(p => p.text.includes(needle))
    if (elsewhere) {
      problems.push(`"${s.text}" steht nicht auf Seite ${s.pageIndex + 1}, sondern auf Seite ${elsewhere.pageIndex + 1}`)
      continue
    }
    // The fuzzy check itself only runs against the single page the model
    // claimed — scanning every other page with it too would turn one missed
    // suggestion into a full-document fuzzy pass. The client applies the same
    // single-page-first fuzzy fallback, so this only needs to predict that,
    // not exhaustively search for the best possible match location.
    const statedPage = pages.find(p => p.pageIndex === s.pageIndex)
    const fuzzyOnStatedPage = statedPage && findFuzzyMatch(statedPage.rawText, s.text)
    if (fuzzyOnStatedPage) continue
    problems.push(`"${s.text}" kommt im Dokument nicht (in dieser Form) vor`)
  }
  return problems
}

export function executeSuggestRedactions(args: Record<string, unknown>, documentPages?: DocumentPage[], foiRules?: RedactionRule[]): { special: SpecialToolResult | null; toolResult: ToolResult; unresolvedCount: number } {
  const rawSuggestions = (args.suggestions as Array<Record<string, unknown>> | undefined) ?? []
  const rawRanges = (args.textRanges as Array<Record<string, unknown>> | undefined) ?? []
  const rawPageRanges = (args.pageRanges as Array<Record<string, unknown>> | undefined) ?? []

  // A model occasionally emits one malformed entry — most often a missing or
  // empty `text` — inside an otherwise valid array. Previously that slipped
  // through as `text: undefined` and crashed the PDF-side matching loop partway
  // through, silently dropping every suggestion that came after it in the same
  // call. Validating and dropping just the bad entry here keeps the rest intact
  // and tells the model exactly what to resend instead.
  const invalid: string[] = []

  let guessedPageCount = 0

  const suggestions: RedactionSuggestion[] = []
  rawSuggestions.forEach((s, i) => {
    const text = typeof s.text === 'string' ? s.text.trim() : ''
    if (!text) { invalid.push(`suggestions[${i}] hat kein (nicht-leeres) "text"-Feld`); return }
    let pageIndex = coerceNumber(s.pageIndex)
    if (pageIndex === undefined) {
      pageIndex = inferPageIndex(text, documentPages)
      if (pageIndex === undefined) { invalid.push(`suggestions[${i}] ("${text}") hat kein gültiges "pageIndex"-Feld und die Seite konnte auch nicht anhand des Texts ermittelt werden`); return }
      guessedPageCount++
    }
    suggestions.push({
      text,
      pageIndex,
      confidence: s.confidence as RedactionSuggestion['confidence'],
      person: s.person as string | undefined,
      personGroup: s.personGroup as string | undefined,
      reason: s.reason as string | undefined,
      rule: resolveRule(s.rule, foiRules),
    })
  })

  const textRanges: TextRangeSuggestion[] = []
  rawRanges.forEach((r, i) => {
    const startText = typeof r.startText === 'string' ? r.startText.trim() : ''
    const endText = typeof r.endText === 'string' ? r.endText.trim() : ''
    if (!startText || !endText) { invalid.push(`textRanges[${i}] hat kein (nicht-leeres) "startText"/"endText"-Feld`); return }
    let startPage = coerceNumber(r.startPage)
    if (startPage === undefined) {
      startPage = inferPageIndex(startText, documentPages)
      if (startPage !== undefined) guessedPageCount++
    }
    let endPage = coerceNumber(r.endPage)
    if (endPage === undefined) {
      endPage = inferPageIndex(endText, documentPages)
      if (endPage !== undefined) guessedPageCount++
    }
    if (startPage === undefined || endPage === undefined) { invalid.push(`textRanges[${i}] hat kein gültiges "startPage"/"endPage"-Feld und die Seite(n) konnten auch nicht anhand des Texts ermittelt werden`); return }
    textRanges.push({
      startText,
      startPage,
      endText,
      endPage,
      confidence: r.confidence as TextRangeSuggestion['confidence'],
      person: r.person as string | undefined,
      personGroup: r.personGroup as string | undefined,
      reason: r.reason as string | undefined,
      rule: resolveRule(r.rule, foiRules),
    })
  })

  // fromPage/toPage have no associated text to infer a page from, so a
  // missing/unparseable value here really does have to be dropped — only the
  // numeric-string coercion applies.
  const pageRanges: PageRangeSuggestion[] = []
  rawPageRanges.forEach((r, i) => {
    const fromPage = coerceNumber(r.fromPage)
    const toPage = coerceNumber(r.toPage)
    if (fromPage === undefined || toPage === undefined) { invalid.push(`pageRanges[${i}] hat kein gültiges "fromPage"/"toPage"-Feld`); return }
    pageRanges.push({
      fromPage,
      toPage,
      confidence: r.confidence as PageRangeSuggestion['confidence'],
      person: r.person as string | undefined,
      personGroup: r.personGroup as string | undefined,
      reason: r.reason as string | undefined,
      rule: resolveRule(r.rule, foiRules),
    })
  })

  const remove = (args.remove as string[] | undefined) ?? []
  const total = suggestions.length + textRanges.length + pageRanges.length
  // An empty call is always a protocol error: a document with nothing to redact
  // is reported in prose instead of through this tool, so reaching here means
  // the arguments failed to serialise rather than that the document is clean.
  if (total === 0 && remove.length === 0) {
    return {
      special: null,
      unresolvedCount: invalid.length,
      toolResult: {
        success: false,
        error: invalid.length
          ? `This call carried only invalid entries and nothing was applied: ${invalid.join('; ')}. Repeat the call with valid entries — each needs at least the exact text copied from the read_documents response, pageIndex, confidence and person.`
          : 'This call carried no arguments, so nothing was applied. If the document genuinely contains nothing to redact, do not call this tool at all — say so in your reply instead. If you did intend to suggest redactions, repeat the call with "suggestions" (or "textRanges"/"pageRanges") populated; each entry needs at least the exact text copied from the read_documents response, pageIndex, confidence and person.',
      },
    }
  }
  const summary = `${total} Vorschläge hinzugefügt (${suggestions.length} Textstellen, ${textRanges.length} Textbereiche, ${pageRanges.length} Seitenbereiche), ${remove.length} entfernt.`
  const problems = describeUnlocatable(suggestions, documentPages)
  const notes = [
    ...(invalid.length ? [`${invalid.length} Einträge waren ungültig und wurden übersprungen: ${invalid.join('; ')}.`] : []),
    ...(guessedPageCount ? [`Hinweis: Bei ${guessedPageCount} Einträgen fehlte die Seitenangabe (oder war ungültig) — die Seite wurde automatisch anhand des Texts ermittelt. Gib pageIndex/startPage/endPage künftig direkt an.`] : []),
    ...(problems.length ? [`Diese Stellen konnten nicht gefunden werden: ${problems.join('; ')}. Wiederhole den Aufruf für sie mit dem exakten Wortlaut aus der read_documents-Antwort.`] : []),
  ]
  return {
    special: { type: 'suggest_redactions', suggestions, textRanges, pageRanges, remove },
    unresolvedCount: invalid.length + problems.length,
    toolResult: {
      success: true,
      data: notes.length ? `${summary} ${notes.join(' ')}` : summary,
    },
  }
}

// Each chat is scoped to exactly one document, so the caller (useChatStream)
// only ever sends that document's own pages here — no filtering needed.
export function executeReadDocuments(documentPages: DocumentPage[] | undefined): ToolResult {
  if (!documentPages || documentPages.length === 0) {
    return { success: false, error: 'No document content available. User must upload documents first.' }
  }
  const docMap = new Map<string, { documentKey: string; documentName: string; pages: { pageIndex: number; text: string }[] }>()
  for (const p of documentPages) {
    if (!docMap.has(p.documentKey)) docMap.set(p.documentKey, { documentKey: p.documentKey, documentName: p.documentName, pages: [] })
    docMap.get(p.documentKey)!.pages.push({ pageIndex: p.pageIndex, text: p.text })
  }
  const documents = Array.from(docMap.values()).map(d => ({ ...d, pageCount: d.pages.length }))
  return {
    success: true,
    data: { documentCount: documents.length, documents },
  }
}

