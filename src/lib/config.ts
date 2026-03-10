export type LocalAi = 'ner-browser' | 'llm' | 'ner'

declare global {
  interface Window { __ER_CFG__?: { cloudAi: boolean; localAi: LocalAi } }
}

const fromWindow = () => typeof window !== 'undefined' ? window.__ER_CFG__ : undefined

export const cloudAiEnabled = fromWindow()?.cloudAi ?? (process.env.CLOUD_AI !== 'false')
export const localAi: LocalAi = fromWindow()?.localAi ?? (process.env.LOCAL_AI as LocalAi) ?? 'ner-browser'
