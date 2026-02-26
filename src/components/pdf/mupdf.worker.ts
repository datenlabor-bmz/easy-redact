/// <reference lib="webworker" />
import * as Comlink from 'comlink'
import * as mupdf from 'mupdf'
import { PDFDocument } from 'mupdf'
import type { Quad, Rect } from 'mupdf'

export const MUPDF_LOADED = 'MUPDF_LOADED'

// Define an interface for the word data we'll return
export interface WordData {
  text: string
  bbox: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

export class MupdfWorker {
  private pdfdocument?: PDFDocument

  constructor() {
    this.initializeMupdf()
  }

  private initializeMupdf() {
    try {
      postMessage(MUPDF_LOADED)
    } catch (error) {
      console.error('Failed to initialize MuPDF:', error)
    }
  }

  loadDocument(document: ArrayBuffer): boolean {
    this.pdfdocument = mupdf.Document.openDocument(
      document,
      'application/pdf'
    ) as PDFDocument
    return true
  }

  loadDocumentAndAnnotations(document: ArrayBuffer): any[] {
    this.loadDocument(document)
    if (!this.pdfdocument) throw new Error('Document not loaded')
    const annotations = []
    for (let i = 0; i < this.getPageCount(); i++) {
      const page = this.pdfdocument.loadPage(i)
      const pageAnnotations = page.getAnnotations()
      for (const annotation of pageAnnotations) {
        const quads = annotation.getQuadPoints()
        const content = annotation.getContents()
        annotations.push({ quads, content, pageIndex: i })
      }
      for (const annotation of pageAnnotations) {
        page.deleteAnnotation(annotation)
      }
    }
    return annotations
  }

  renderPageAsImage(pageIndex: number = 0, scale: number = 1): Uint8Array {
    if (!this.pdfdocument) throw new Error('Document not loaded')
    const page = this.pdfdocument.loadPage(pageIndex)
    const pixmap = page.toPixmap(
      [scale, 0, 0, scale, 0, 0],
      mupdf.ColorSpace.DeviceRGB
    )
    const png = pixmap.asPNG()
    pixmap.destroy()
    return png
  }

  getPageBounds(pageIndex: number = 0): Rect {
    if (!this.pdfdocument) throw new Error('Document not loaded')
    return this.pdfdocument.loadPage(pageIndex).getBounds()
  }

  getPageContent(pageIndex: number = 0): string {
    if (!this.pdfdocument) throw new Error('Document not loaded')
    return this.pdfdocument
      .loadPage(pageIndex)
      .toStructuredText()
      .asJSON()
  }

  searchPage(pageIndex: number = 0, text: string): Quad[][] {
    if (!this.pdfdocument) throw new Error('Document not loaded')
    const page = this.pdfdocument.loadPage(pageIndex)
    const words = page.search(text)
    return words
  }

  getPageCount(): number {
    if (!this.pdfdocument) throw new Error('Document not loaded')
    return this.pdfdocument.countPages()
  }

  getPageWords(pageIndex: number = 0): WordData[] {
    if (!this.pdfdocument) throw new Error('Document not loaded')

    const page = this.pdfdocument.loadPage(pageIndex)
    const structuredText = page.toStructuredText('words')

    const words: WordData[] = []
    let currentWord = ''
    let currentQuad:
      | [number, number, number, number, number, number, number, number]
      | null = null

    structuredText.walk({
      onChar(c, _origin, _font, _size, quad) {
        if (c === ' ' && currentWord) {
          if (currentQuad) {
            const [_x0, _y0, _x1, _y1, _x2, _y2, _x3, _y3] = currentQuad
            const x0 = Math.min(_x0, _x1, _x2, _x3)
            const y0 = Math.min(_y0, _y1, _y2, _y3)
            const x1 = Math.max(_x0, _x1, _x2, _x3)
            const y1 = Math.max(_y0, _y1, _y2, _y3)

            words.push({
              text: currentWord,
              bbox: { x0, y0, x1, y1 }
            })
          }
          currentWord = ''
          currentQuad = null
        } else if (c !== ' ') {
          if (!currentQuad) {
            currentQuad = quad
          } else {
            currentQuad[4] = quad[4]
            currentQuad[5] = quad[5]
            currentQuad[2] = quad[2]
            currentQuad[3] = quad[3]
            currentQuad[6] = quad[6]
            currentQuad[7] = quad[7]
          }
          currentWord += c
        }
      },

      endLine() {
        if (currentWord && currentQuad) {
          const [_x0, _y0, _x1, _y1, _x2, _y2, _x3, _y3] = currentQuad
          const x0 = Math.min(_x0, _x1, _x2, _x3)
          const y0 = Math.min(_y0, _y1, _y2, _y3)
          const x1 = Math.max(_x0, _x1, _x2, _x3)
          const y1 = Math.max(_y0, _y1, _y2, _y3)

          words.push({
            text: currentWord,
            bbox: { x0, y0, x1, y1 }
          })

          currentWord = ''
          currentQuad = null
        }
      },

      endTextBlock() {
        // Text block ends
      }
    })

    return words
  }

  getMetadata(): Record<string, string> {
    if (!this.pdfdocument) throw new Error('Document not loaded')
    const result: Record<string, string> = {}
    const info = this.pdfdocument.getTrailer().get('Info')
    if (info && !info.isNull() && info.isDictionary()) {
      info.forEach((val: any, key: string | number) => {
        if (typeof key === 'string' && val.isString()) result[key] = val.asString()
      })
    }
    return result
  }

  getRedactedDocument(annotations: any[], applyRedactions: boolean = true, fieldsToRemove: string[] = []) {
    if (!this.pdfdocument) throw new Error('Document not loaded')

    const doc = mupdf.Document.openDocument(
      this.pdfdocument.saveToBuffer().asUint8Array(),
      'application/pdf'
    ) as PDFDocument

    for (const annotation of annotations) {
      const pageNumber = annotation.position.pageNumber
      const page = doc.loadPage(pageNumber)
      const redaction = page.createAnnotation('Redact')
      redaction.setContents(annotation.content)
      redaction.setQuadPoints(annotation.position.quads)
      if (applyRedactions) {
        redaction.applyRedaction(1, 2)
        const textAnnotation = page.createAnnotation('FreeText')
        textAnnotation.setContents(annotation.content)
        textAnnotation.setRect(annotation.position.rect)
        textAnnotation.setDefaultAppearance('Helvetica', 8, [1, 1, 1])
      }
    }

    for (let i = 0; i < doc.countPages(); i++) {
      const page = doc.loadPage(i)
      page.update()
    }

    if (applyRedactions) {
      doc.bake()
    }

    if (fieldsToRemove.length) {
      try {
        const info = doc.getTrailer().get('Info')
        if (info && !info.isNull() && info.isDictionary()) {
          for (const key of fieldsToRemove) info.delete(key)
        }
      } catch {}
      try { doc.getTrailer().get('Root').delete('Metadata') } catch {}
    }

    const output = doc.saveToBuffer(fieldsToRemove.length ? 'garbage,regenerate-id' : '')
    const pdfBlob = new Blob([output.asUint8Array() as unknown as BlobPart], {
      type: 'application/pdf'
    })

    doc.destroy()
    return pdfBlob
  }
}

Comlink.expose(new MupdfWorker())

