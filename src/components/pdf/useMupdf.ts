import { MUPDF_LOADED, type MupdfWorker } from './mupdf.worker'
import * as Comlink from 'comlink'
import { Remote } from 'comlink'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useMupdf() {
  const [isWorkerInitialized, setIsWorkerInitialized] = useState(false)
  const document = useRef<ArrayBuffer | null>(null)
  const mupdfWorker = useRef<Remote<MupdfWorker> | undefined>(undefined)

  useEffect(() => {
    const worker = new Worker(
      new URL('./mupdf.worker', import.meta.url),
      {
        type: 'module'
      }
    )
    mupdfWorker.current = Comlink.wrap<MupdfWorker>(worker)

    worker.addEventListener('message', event => {
      if (event.data === MUPDF_LOADED) {
        setIsWorkerInitialized(true)
      }
    })

    return () => {
      worker.terminate()
    }
  }, [])

  const loadDocument = useCallback((arrayBuffer: ArrayBuffer) => {
    document.current = arrayBuffer
    return mupdfWorker.current!.loadDocument(arrayBuffer)
  }, [])

  const loadDocumentAndAnnotations = useCallback((arrayBuffer: ArrayBuffer) => {
    document.current = arrayBuffer
    return mupdfWorker.current!.loadDocumentAndAnnotations(arrayBuffer)
  }, [])

  const renderPage = useCallback((pageIndex: number) => {
    if (!document.current) {
      throw new Error('Document not loaded')
    }
    return mupdfWorker.current!.renderPageAsImage(
      pageIndex,
      (window.devicePixelRatio * 96) / 72
    )
  }, [])

  const getPageBounds = useCallback((pageIndex: number) => {
    if (!document.current) {
      throw new Error('Document not loaded')
    }
    return mupdfWorker.current!.getPageBounds(pageIndex)
  }, [])

  const getPageContent = useCallback((pageIndex: number) => {
    if (!document.current) {
      throw new Error('Document not loaded')
    }
    return mupdfWorker.current!.getPageContent(pageIndex)
  }, [])

  const searchPage = useCallback((pageIndex: number, text: string) => {
    if (!document.current) {
      throw new Error('Document not loaded')
    }
    return mupdfWorker.current!.searchPage(pageIndex, text)
  }, [])

  const getPageWords = useCallback((pageIndex: number) => {
    if (!document.current) {
      throw new Error('Document not loaded')
    }
    return mupdfWorker.current!.getPageWords(pageIndex)
  }, [])

  const countPages = useCallback(() => {
    if (!document.current) {
      throw new Error('Document not loaded')
    }
    return mupdfWorker.current!.getPageCount()
  }, [])

  const getRedactedDocument = useCallback((annotations: any[], applyRedactions: boolean = true) => {
    if (!document.current) {
      throw new Error('Document not loaded')
    }
    return mupdfWorker.current!.getRedactedDocument(annotations, applyRedactions)
  }, [])

  return {
    isWorkerInitialized,
    loadDocument,
    loadDocumentAndAnnotations,
    renderPage,
    countPages,
    getPageContent,
    getPageBounds,
    getPageWords,
    getRedactedDocument,
    searchPage
  }
}

