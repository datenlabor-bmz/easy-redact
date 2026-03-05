export type LocalBackend = 'browser' | 'llm' | 'spacy'

export const cloudAiEnabled = process.env.NEXT_PUBLIC_CLOUD_AI_ENABLED !== 'false'
export const localBackend = (process.env.NEXT_PUBLIC_LOCAL_BACKEND ?? 'browser') as LocalBackend
