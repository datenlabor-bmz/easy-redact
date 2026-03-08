[[Gitlab repo](https://gitlab.opencode.de/datenlabor-bmz/easy-redact) | [Github mirror](https://github.com/datenlabor-bmz)]

# EasyRedact

AI-assisted PDF redaction tool for German federal ministries (BMZ). Upload a PDF or DOCX, have the AI suggest redactions via an interactive chat, review and adjust them, then export a fully redacted document — everything runs in the browser, documents never leave the machine unless you choose Cloud AI mode.

## Features

- **Two redaction modes**
  - **PII** — redacts personal data: names, addresses, emails, phone numbers, bank details, dates of birth
  - **FOI / IFG** — redacts based on the exemption clauses of a chosen Freedom of Information law; jurisdiction rules are loaded at runtime from [`datenlabor-bmz/redaction-rules`](https://github.com/datenlabor-bmz/redaction-rules)

- **Two AI modes** (switchable at any time via the mode selector)
  - **Cloud AI** — Azure OpenAI (GDPR-compliant, no data retention, no model training)
  - **Local AI** — processes documents on your own infrastructure; backend is configured via `LOCAL_BACKEND` (see below)

- **AI chat assistant** — reads the document, asks targeted clarifying questions, then suggests redactions with exact text matches, confidence ratings, affected persons, and legal justifications

- **Manual redactions** — draw rectangles or select text directly on the PDF without AI involvement

- **Multi-document tabs** — open multiple PDFs at once; session (documents, redactions, chat) is persisted in IndexedDB and survives page reload

- **Export**
  - Preview PDF — yellow highlight boxes for review and sign-off
  - Redacted PDF — text permanently removed via MuPDF, ready for publication

- **DOCX → PDF conversion** — LibreOffice-backed, Docker deployment only

## Architecture

Three-panel layout rendered entirely client-side:

| Panel | Content |
|-------|---------|
| Left | Redaction list grouped by person/page; accept / ignore controls; FOI rule assignment |
| Center | PDF viewer (MuPDF WASM in a Comlink worker); zoom; export |
| Right | Chat or NLP panel; AI mode selector; streaming SSE from `/api/chat` |

The Next.js API routes (`/api/chat`, `/api/docx`, `/api/nlp`) are thin server-side proxies — all document rendering and redaction geometry stay in the browser.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local` and fill in at minimum the Azure OpenAI credentials.

## Environment Variables

See `.env.example` for the full list. Key variables:

```env
# Azure OpenAI — required for Cloud AI mode
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_BASE=https://YOUR-RESOURCE.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5.2

# Local LLM (Ollama or other OpenAI-compatible API — used when LOCAL_BACKEND=llm)
OPENAI_API_BASE=http://localhost:11434/v1
OPENAI_API_KEY=ollama
LOCAL_LLM_MODEL=llama3.3:latest

# Deployment configuration
# NEXT_PUBLIC_CLOUD_AI_ENABLED: 'true' (default) or 'false' to hide Cloud AI option
# NEXT_PUBLIC_LOCAL_BACKEND: 'browser' (default), 'llm', or 'spacy'
# LOCAL_BACKEND: runtime override for NEXT_PUBLIC_LOCAL_BACKEND (Docker)

# Corporate proxy (optional)
# HTTPS_PROXY=http://proxy.example.com:8080
# HTTP_PROXY=http://proxy.example.com:8080
# NO_PROXY=localhost,127.0.0.1
```

### Deployment profiles

| Profile | `CLOUD_AI_ENABLED` | `LOCAL_BACKEND` | Use case |
|---------|-------------------|-----------------|----------|
| Online demo | `true` (default) | `browser` (default) | easyredact.io — Cloud AI + in-browser NLP (coming soon) |
| On-premise (GPU) | `true` | `llm` | Cloud AI + local LLM via Ollama/vLLM |
| On-premise (CPU) | `true` | `spacy` | Cloud AI + spaCy NER for standard hardware |
| Air-gapped | `false` | `llm` or `spacy` | No cloud connection at all |

## Docker

### Pre-built images

Pre-built images are published to GitHub Container Registry on every release:

```bash
# Standard image (serves at /)
docker pull ghcr.io/datenlabor-bmz/easy-redact:latest
docker run -p 3000:3000 --env-file .env.local ghcr.io/datenlabor-bmz/easy-redact:latest

# Image with BASE_PATH=/easyredact (serves at /easyredact/)
docker pull ghcr.io/datenlabor-bmz/easy-redact-with-base-path:latest
docker run -p 3000:3000 --env-file .env.local ghcr.io/datenlabor-bmz/easy-redact-with-base-path:latest
```

### Building from source

The Dockerfile bundles LibreOffice (DOCX conversion), Python + uv, and the German spaCy model (`de_core_news_lg`). By default it sets `LOCAL_BACKEND=spacy`:

```bash
docker build -t easy-redact .
docker run -p 3000:3000 --env-file .env.local easy-redact
```

For production deployment on `linux/amd64` (e.g. when building on Apple Silicon):

```bash
docker buildx build --platform linux/amd64 -t easy-redact .
```

To use a local LLM instead of spaCy, override `LOCAL_BACKEND` at runtime:

```bash
docker run -p 3000:3000 -e LOCAL_BACKEND=llm --env-file .env.local easy-redact
```

DOCX upload and spaCy NLP are only available in the Docker build; they return HTTP 501 otherwise.

### Subpath deployment

To serve the app under a subpath (e.g. `acme.bund.de/easyredact/`), pass `BASE_PATH` at build time:

```bash
docker build --platform linux/amd64 --build-arg BASE_PATH=/easyredact -t easy-redact .
```

This sets the Next.js `basePath`, which rewrites all routes, assets, and API endpoints. Configure nginx to forward requests without stripping the prefix:

```nginx
location /easyredact/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **MuPDF** 1.27 — PDF rendering and redacted export via WASM + Comlink web worker
- **OpenAI SDK** — `AzureOpenAI` for cloud, `OpenAI` for local; streaming chat completions with function calling
- **spaCy** (`de_core_news_lg`) — German NER, invoked via a Python script with `uv run`
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **IndexedDB** (via `idb`) — client-side persistence for files, session state, and chat history

## See Also

- [`datenlabor-bmz/redaction-ui`](https://github.com/datenlabor-bmz/redaction-ui) — standalone React component library (`@datenlabor-bmz/redaction-ui`) for PDF viewing and redaction, published to npm for use in other applications
- [`datenlabor-bmz/redaction-rules`](https://github.com/datenlabor-bmz/redaction-rules) — machine-readable FOI exemption rules by jurisdiction, fetched at runtime in FOI mode

## License

AGPL-3.0. This project uses [MuPDF](https://mupdf.com/licensing/) which is licensed under the GNU Affero General Public License.

## Credits

Built by the [BMZ DataLab](https://www.bmz-digital.global/en/overview-of-initiatives/the-bmz-data-lab/), the data science unit of Germany's Federal Ministry for Economic Cooperation and Development.

Funded by the European Union — [NextGenerationEU](https://next-generation-eu.europa.eu).

<a href="https://next-generation-eu.europa.eu"><img src="public/logo-nextgen-eu.jpg" alt="NextGenerationEU" height="80"></a>  <a href="https://www.bmz-digital.global/en/overview-of-initiatives/the-bmz-data-lab/"><img src="public/logo-datalab.svg" alt="BMZ DataLab" height="60"></a>
