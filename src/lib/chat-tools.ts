import type { RedactionSuggestion, AskUserQuestion } from '@/types'

// ── Tool schemas for OpenAI function calling ───────────────────────────────────

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'ask_user',
      description: 'Ask the user a structured question with pre-defined answer options. Use this for all key decisions (redaction mode, person categories, information types, model choice, etc.). The UI will display clickable option chips.',
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
      name: 'request_document_access',
      description: 'Request permission to read the uploaded documents. This triggers a consent dialog outside the chat that the user must explicitly confirm. You CANNOT bypass this - do not call read_documents without going through this first.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Why you need access to the documents (shown to user in the consent dialog)' },
        },
        required: ['reason'],
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
                pageIndex: { type: 'number', description: '0-based page index' },
                confidence: { type: 'string', enum: ['high', 'low'], description: 'high = certain, low = ambiguous individual case' },
                person: { type: 'string', description: 'Name of the person or organisation this redaction belongs to — use the actual name (e.g. "Max Mustermann", "Diversifix e. V."), never leave empty' },
                personGroup: { type: 'string', description: 'Group category, e.g. "Privatpersonen", "Bundesbeamte", "Organisationen"' },
                reason: { type: 'string', description: 'Brief explanation why this should be redacted' },
                rule: {
                  type: 'object',
                  description: 'The specific FOI rule that justifies this redaction (FOI mode only)',
                  properties: {
                    title: { type: 'string', description: 'Rule title, e.g. "Personenbezogene Daten"' },
                    reference: { type: 'string', description: 'Legal reference, e.g. "§5 IFG"' },
                    group: { type: 'string', description: 'Rule group/category' },
                  },
                  required: ['title'],
                },
              },
              required: ['text', 'pageIndex', 'confidence', 'person', 'personGroup'],
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
  {
    type: 'function' as const,
    function: {
      name: 'start_nlp_processing',
      description: 'Start local NLP processing (e.g. spaCy) when the user does not want to use a cloud LLM for document analysis. This processes documents locally without sending content to any cloud service.',
      parameters: {
        type: 'object',
        properties: {
          model: {
            type: 'string',
            enum: ['spacy', 'stanza', 'piiranha', 'browser'],
            description: 'Which NLP model to use',
          },
        },
        required: ['model'],
      },
    },
  },
]

// The read_documents tool is only added to the schema when consent is given
export const readDocumentsTool = {
  type: 'function' as const,
  function: {
    name: 'read_documents',
    description: 'Read the text content of all uploaded documents. Only available after the user has granted document access consent. Returns page-by-page text content.',
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
  | { type: 'consent_required'; reason: string }
  | { type: 'ask_user'; question: AskUserQuestion }
  | { type: 'suggest_redactions'; suggestions: RedactionSuggestion[]; remove: string[] }

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

export function executeRequestDocumentAccess(args: Record<string, unknown>): { special: SpecialToolResult; toolResult: ToolResult } {
  return {
    special: { type: 'consent_required', reason: args.reason as string },
    toolResult: { success: true, data: 'Consent dialog shown to user. Awaiting decision outside the chat.' },
  }
}

export function executeSuggestRedactions(args: Record<string, unknown>): { special: SpecialToolResult; toolResult: ToolResult } {
  const raw = args.suggestions as Array<Record<string, unknown>>
  const suggestions: RedactionSuggestion[] = raw.map(s => ({
    text: s.text as string,
    pageIndex: s.pageIndex as number,
    confidence: s.confidence as RedactionSuggestion['confidence'],
    person: s.person as string | undefined,
    personGroup: s.personGroup as string | undefined,
    reason: s.reason as string | undefined,
    rule: s.rule as RedactionSuggestion['rule'],
  }))
  const remove = (args.remove as string[] | undefined) ?? []
  return {
    special: { type: 'suggest_redactions', suggestions, remove },
    toolResult: { success: true, data: `${suggestions.length} Vorschläge hinzugefügt, ${remove.length} entfernt.` },
  }
}

export function executeReadDocuments(documentPages: Array<{ pageIndex: number; text: string }> | undefined): ToolResult {
  if (!documentPages || documentPages.length === 0) {
    return { success: false, error: 'No document content available. User must upload documents first.' }
  }
  return {
    success: true,
    data: {
      pageCount: documentPages.length,
      pages: documentPages,
    },
  }
}

export function executeStartNlpProcessing(args: Record<string, unknown>): ToolResult {
  const model = args.model as string
  const available = process.env.SPACY_ENABLED === 'true'
  if (!available && model !== 'browser') {
    return { success: false, error: `NLP model '${model}' is only available in Docker deployment. Browser-based NLP is not yet implemented.` }
  }
  return { success: true, data: { model, status: 'started', message: `NLP-Verarbeitung mit ${model} gestartet. Ergebnisse werden im Dokument angezeigt.` } }
}
