import { loadRulesIndex, loadRuleFile } from '@/lib/redaction-rules'

// Proxy for the browser: serves the FOI rule sets from whichever source
// REDACTION_RULES_SOURCE selects (local bundle or the GitHub repo).
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  try {
    const data = id ? await loadRuleFile(id) : await loadRulesIndex()
    if (!data) return new Response(null, { status: 404 })
    return Response.json(data)
  } catch {
    return new Response(null, { status: 502 })
  }
}
