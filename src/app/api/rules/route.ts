const INDEX_URL = 'https://raw.githubusercontent.com/datenlabor-bmz/redaction-rules/refs/heads/main/rules.json'
const RULES_BASE = 'https://raw.githubusercontent.com/datenlabor-bmz/redaction-rules/main/rules'

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  const url = id ? `${RULES_BASE}/${id}.json` : INDEX_URL
  const res = await fetch(url)
  if (!res.ok) return new Response(null, { status: res.status })
  return new Response(res.body, { headers: { 'content-type': 'application/json' } })
}
