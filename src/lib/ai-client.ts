import { AzureOpenAI, OpenAI } from 'openai'

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

// Mirror env var names from redaction-app/backend/app/api.py exactly
export function getCloudClient() {
  return new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    endpoint: process.env.AZURE_OPENAI_API_BASE!,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-12-01-preview',
    ...getProxyOptions(),
  })
}

export function getLocalClient() {
  return new OpenAI({
    baseURL: process.env.OPENAI_API_BASE ?? 'http://localhost:11434/v1',
    apiKey: process.env.OPENAI_API_KEY ?? 'ollama',
    ...getProxyOptions(),
  })
}

export const modelCloud = () => process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-5.2'
export const modelLocal = () => process.env.LOCAL_LLM_MODEL ?? 'llama3.3:latest'

export function getClient(model: 'cloud' | 'local') {
  return model === 'local'
    ? { client: getLocalClient(), model: modelLocal() }
    : { client: getCloudClient(), model: modelCloud() }
}
