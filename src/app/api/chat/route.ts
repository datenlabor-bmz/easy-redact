import { getClient } from '@/lib/ai-client'
import {
  tools, readDocumentsTool, SpecialToolResult,
  executeAskUser, executeRequestDocumentAccess, executeSuggestRedactions,
  executeReadDocuments, executeStartNlpProcessing,
} from '@/lib/chat-tools'
import { buildSystemPrompt } from '@/lib/system-prompt'
import { getRulesForJurisdiction } from '@/lib/redaction-rules'
import type { ChatRequest, ApiChatMessage } from '@/types'

type SSEController = ReadableStreamDefaultController
const enc = new TextEncoder()

function send(ctrl: SSEController, event: Record<string, unknown>) {
  ctrl.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`))
}

async function* streamCompletion(client: any, model: string, messages: ApiChatMessage[], toolList: any[]) {
  const stream = await client.chat.completions.create({ model, messages, tools: toolList, stream: true })
  for await (const chunk of stream) yield chunk
}

export async function POST(req: Request) {
  const body: ChatRequest = await req.json()
  const { messages, model, consent, redactionMode, foiJurisdiction, documentPages, currentRedactions, locale } = body

  if (process.env.NODE_ENV !== 'production') {
    console.log('[chat] POST', { consent, redactionMode, messageCount: messages.length, hasDocumentPages: !!documentPages?.length })
  }

  // Load FOI rules if needed
  const foiRules = redactionMode === 'foi' && foiJurisdiction
    ? await getRulesForJurisdiction(foiJurisdiction).catch(() => undefined)
    : undefined

  const systemPrompt = buildSystemPrompt({
    redactionMode, foiJurisdiction, foiRules,
    hasDocumentAccess: !!consent,
    locale,
  })

  const { client, model: modelName } = getClient(consent === 'local' ? 'local' : 'cloud')
  // Once consent is granted: remove request_document_access (no need to ask again) and add read_documents
  const activeTools = consent
    ? [...tools.filter(t => t.function.name !== 'request_document_access'), readDocumentsTool]
    : tools

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        const apiMessages: ApiChatMessage[] = [
          { role: 'system', content: systemPrompt },
          ...messages,
        ]

        if (currentRedactions?.length) {
          const lines = currentRedactions.map(r =>
            `- ID: ${r.id} | Status: ${r.status} | Document: ${r.documentName ?? r.documentKey} | Page ${r.pageIndex + 1} | "${r.text}"${r.person ? ` | Person: ${r.person}` : ''}${r.personGroup ? ` (${r.personGroup})` : ''}`
          )
          apiMessages.push({
            role: 'system',
            content: `Current redaction status (complete, ${currentRedactions.length} entries):\n${lines.join('\n')}\n\nOnly entries with status "suggested" can be removed via the remove array in suggest_redactions.`,
          })
        }

        let iterations = 0
        while (iterations < 20) {
          iterations++
          let assistantContent = ''
          let toolCalls: ApiChatMessage['tool_calls'] = []
          const toolCallArgs = new Map<number, string>()

          for await (const chunk of streamCompletion(client, modelName, apiMessages, activeTools)) {
            const delta = chunk.choices?.[0]?.delta
            if (delta?.content) {
              assistantContent += delta.content
              send(ctrl, { type: 'text_delta', content: delta.content })
            }
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index
                if (tc.id) {
                  toolCalls![idx] = { id: tc.id, type: 'function', function: { name: tc.function?.name ?? '', arguments: '' } }
                  toolCallArgs.set(idx, '')
                } else if (toolCalls![idx] && tc.function?.name && !toolCalls![idx].function.name) {
                  toolCalls![idx].function.name = tc.function.name
                }
                if (tc.function?.arguments) {
                  toolCallArgs.set(idx, (toolCallArgs.get(idx) ?? '') + tc.function.arguments)
                }
              }
            }
          }

          for (const [idx, args] of toolCallArgs) {
            if (toolCalls![idx]) toolCalls![idx].function.arguments = args
          }
          toolCalls = toolCalls!.filter(Boolean)

          if (!toolCalls.length) {
            send(ctrl, { type: 'done' })
            break
          }

          // Only process the first tool call per iteration
          toolCalls = toolCalls.slice(0, 1)
          apiMessages.push({ role: 'assistant', content: assistantContent, tool_calls: toolCalls })

          for (const tc of toolCalls) {
            const name = tc.function.name
            let args: Record<string, unknown> = {}
            try { args = JSON.parse(tc.function.arguments) } catch {
              send(ctrl, { type: 'tool_result', name, result: { error: 'Invalid arguments' }, success: false })
              apiMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ error: 'Invalid arguments' }) })
              continue
            }

            send(ctrl, { type: 'tool_start', id: tc.id, name, args })

            let result: { success: boolean; data?: unknown; error?: string }
            let special: SpecialToolResult | null = null

            switch (name) {
              case 'ask_user': {
                const r = executeAskUser(args)
                special = r.special
                result = r.toolResult
                break
              }
              case 'request_document_access': {
                const r = executeRequestDocumentAccess(args)
                special = r.special
                result = r.toolResult
                break
              }
              case 'suggest_redactions': {
                const r = executeSuggestRedactions(args)
                special = r.special
                result = r.toolResult
                break
              }
              case 'read_documents':
                result = executeReadDocuments(documentPages)
                break
              case 'start_nlp_processing':
                result = executeStartNlpProcessing(args)
                break
              default:
                result = { success: false, error: `Unknown tool: ${name}` }
            }

            // Send special SSE events before the tool_result
            if (special) {
              if (special.type === 'consent_required') {
                send(ctrl, { type: 'consent_required', reason: special.reason })
              } else if (special.type === 'ask_user') {
                send(ctrl, { type: 'ask_user', question: special.question })
              } else if (special.type === 'suggest_redactions') {
                send(ctrl, { type: 'suggest_redactions', suggestions: special.suggestions, textRanges: special.textRanges, pageRanges: special.pageRanges, remove: special.remove })
              }
            }

            send(ctrl, { type: 'tool_result', name, result: result.success ? result.data : result.error, success: result.success })
            apiMessages.push({
              role: 'tool', tool_call_id: tc.id,
              content: JSON.stringify(result.success ? result.data : { error: result.error }),
            })

            if (special?.type === 'consent_required' || special?.type === 'ask_user') {
              send(ctrl, { type: 'done' })
              return
            }
          }
        }

        if (iterations >= 20) send(ctrl, { type: 'error', message: 'Maximum iterations reached' })
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[chat] error', err)
        send(ctrl, { type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      } finally {
        ctrl.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
