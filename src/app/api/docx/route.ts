import { spawn } from 'child_process'
import { writeFile, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const LIBREOFFICE = process.env.LIBREOFFICE_PATH

export async function POST(req: Request) {
  if (!LIBREOFFICE) {
    return new Response(
      JSON.stringify({ error: 'DOCX-Konvertierung ist nur in der Docker-Umgebung verfügbar. Bitte nutzen Sie die Docker-Installation für diese Funktion.' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const form = await req.formData()
  const file = form.get('file') as File
  if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })

  const id = randomUUID()
  const inPath = join(tmpdir(), `${id}.docx`)
  const outDir = tmpdir()

  await writeFile(inPath, Buffer.from(await file.arrayBuffer()))

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(LIBREOFFICE, ['--headless', '--convert-to', 'pdf', '--outdir', outDir, inPath])
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`LibreOffice exited with code ${code}`)))
  })

  const pdfPath = join(outDir, `${id}.pdf`)
  const pdfData = await readFile(pdfPath)
  await rm(inPath, { force: true })
  await rm(pdfPath, { force: true })

  return new Response(pdfData, { headers: { 'Content-Type': 'application/pdf' } })
}
