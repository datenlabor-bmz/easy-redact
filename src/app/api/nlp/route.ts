import { spawn } from 'child_process'
import { join } from 'path'
import type { RedactionSuggestion } from '@/types'

export async function POST(req: Request) {
  if (process.env.SPACY_ENABLED !== 'true') {
    return new Response(
      JSON.stringify({ error: 'NLP-Verarbeitung ist nur in der Docker-Umgebung verfügbar.' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const body = await req.json()
  const scriptPath = join(process.cwd(), 'scripts', 'spacy_nlp.py')

  const suggestions = await new Promise<RedactionSuggestion[]>((resolve, reject) => {
    const proc = spawn('uv', ['run', scriptPath])
    let stdout = '', stderr = ''
    proc.stdin.write(JSON.stringify(body.pages))
    proc.stdin.end()
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', code => {
      if (code !== 0) reject(new Error(`spaCy script failed: ${stderr}`))
      else resolve(JSON.parse(stdout) as RedactionSuggestion[])
    })
  })

  return Response.json({ suggestions })
}
