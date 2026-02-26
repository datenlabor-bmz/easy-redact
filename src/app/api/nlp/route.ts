import { spawn } from 'child_process'
import { join } from 'path'
import { extractRegexEntities } from '@/lib/regex-entities'
import type { RedactionSuggestion } from '@/types'
import type { RegexCategory } from '@/lib/regex-entities'

type NerCategory = 'PER' | 'ORG' | 'LOC'

interface NlpRequest {
  pages: Array<{ pageIndex: number; text: string }>
  nerCategories?: NerCategory[]
  regexCategories?: RegexCategory[]
}

async function runSpacy(pages: NlpRequest['pages']): Promise<RedactionSuggestion[]> {
  if (process.env.SPACY_ENABLED !== 'true') return []
  const scriptPath = join(process.cwd(), 'scripts', 'spacy_nlp.py')
  return new Promise((resolve, reject) => {
    const proc = spawn('uv', ['run', scriptPath])
    let stdout = '', stderr = ''
    proc.stdin.write(JSON.stringify(pages))
    proc.stdin.end()
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', code => {
      if (code !== 0) reject(new Error(`spaCy: ${stderr}`))
      else resolve(JSON.parse(stdout) as RedactionSuggestion[])
    })
  })
}

const NER_TO_REASON: Record<string, string> = { PER: 'Erkannte Entität: PER', ORG: 'Erkannte Entität: ORG', LOC: 'Erkannte Entität: LOC' }

export async function POST(req: Request) {
  const { pages, nerCategories, regexCategories }: NlpRequest = await req.json()

  const [spacySuggestions, regexSuggestions] = await Promise.all([
    runSpacy(pages),
    Promise.resolve(extractRegexEntities(pages, regexCategories)),
  ])

  const nerFiltered = nerCategories
    ? spacySuggestions.filter(s => nerCategories.some(c => s.reason === NER_TO_REASON[c]))
    : spacySuggestions

  const seen = new Set(nerFiltered.map(s => `${s.pageIndex}:${s.text}`))
  const merged = [...nerFiltered, ...regexSuggestions.filter(s => !seen.has(`${s.pageIndex}:${s.text}`))]

  return Response.json({ suggestions: merged })
}
