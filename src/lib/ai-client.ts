import { OpenAI } from 'openai'

function getProxyOptions() {
  const proxy = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY
  if (!proxy) return {}
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require('undici')
  const dispatcher = new ProxyAgent(proxy)
  return {
    fetch: (url: string | URL | Request, init?: RequestInit) =>
      (undiciFetch as typeof globalThis.fetch)(url as string, { ...init, dispatcher } as RequestInit),
  }
}

function makeClient(baseURL: string, apiKey: string) {
  return new OpenAI({ baseURL, apiKey, ...getProxyOptions() })
}

export const modelCloud = () => process.env.CLOUD_LLM_MODEL ?? 'gpt-5.2'
export const modelLocal = () => process.env.LOCAL_LLM_MODEL ?? 'llama3.3:latest'

export function getClient(mode: 'cloud' | 'local') {
  return mode === 'local'
    ? { client: makeClient(process.env.LOCAL_LLM_API_BASE ?? 'http://localhost:11434/v1', process.env.LOCAL_LLM_API_KEY ?? 'ollama'), model: modelLocal() }
    : { client: makeClient(process.env.CLOUD_LLM_API_BASE!, process.env.CLOUD_LLM_API_KEY!), model: modelCloud() }
}
