# EasyRedact

AI-assisted PDF redaction tool for German federal ministries (BMZ). Upload a PDF or DOCX, have the AI suggest redactions via an interactive chat, review and adjust them, then export a fully redacted document — everything runs in the browser, documents never leave the machine unless you explicitly consent.

## Features

- **Two redaction modes**
  - **PII** — redacts personal data: names, addresses, emails, phone numbers, bank details, dates of birth
  - **FOI / IFG** — redacts based on the exemption clauses of a chosen Freedom of Information law; jurisdiction rules are loaded at runtime from [`datenlabor-bmz/redaction-rules`](https://github.com/datenlabor-bmz/redaction-rules)

- **AI chat assistant** — guides you through the workflow: requests explicit document access consent, reads the document, asks targeted clarifying questions, then calls `suggest_redactions` with exact text matches, confidence ratings, affected persons, and legal justifications

- **Three processing options** (selectable per session)
  - **Cloud AI** — Azure OpenAI (GDPR-compliant, no data retention, no model training)
  - **Local LLM** — any Ollama-compatible OpenAI API endpoint on your own server (enabled via `NEXT_PUBLIC_LOCAL_LLM_ENABLED=true`)
  - **spaCy NLP** — local German NER without any LLM, Docker deployment only

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
| Right | Chat panel; streaming SSE from `/api/chat`; consent and mode controls |

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
# Azure OpenAI — required for cloud AI mode
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_BASE=https://YOUR-RESOURCE.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-12-01-preview   # default
AZURE_OPENAI_DEPLOYMENT=gpt-5.2               # default

# Local LLM (Ollama or any OpenAI-compatible endpoint)
OPENAI_API_BASE=http://localhost:11434/v1
OPENAI_API_KEY=ollama
LOCAL_LLM_MODEL=llama3.3:latest
NEXT_PUBLIC_LOCAL_LLM_ENABLED=true            # shows local LLM option in UI

# Corporate proxy (required at BMZ)
HTTPS_PROXY=
HTTP_PROXY=
NO_PROXY=localhost,127.0.0.1

# Docker-only (set automatically in the Dockerfile)
LIBREOFFICE_PATH=/usr/bin/libreoffice
SPACY_ENABLED=true
```

## Docker

The Dockerfile bundles LibreOffice (DOCX conversion), Python + uv, and the German spaCy model (`de_core_news_lg`):

```bash
docker build -t easy-redact .
docker run -p 3000:3000 --env-file .env.local easy-redact
```

DOCX upload and spaCy NLP are only available in the Docker build; they return HTTP 501 otherwise.

### Subpath deployment

To serve the app under a subpath (e.g. `datenlabor.bmz.bund.de/easyredact/`), pass `BASE_PATH` at build time:

```bash
docker build --build-arg BASE_PATH=/easyredact -t easy-redact .
```

This sets the Next.js `basePath`, which rewrites all routes, assets, and API endpoints. The nginx reverse proxy should forward requests to `/easyredact/...` as-is — do not strip the prefix.

## Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **MuPDF** 1.27 — PDF rendering and redacted export via WASM + Comlink web worker
- **OpenAI SDK** — `AzureOpenAI` for cloud, `OpenAI` for local; streaming chat completions with function calling
- **spaCy** (`de_core_news_lg`) — German NER, invoked via a Python script with `uv run`
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **IndexedDB** (via `idb`) — client-side persistence for files, session state, and chat history

## License

AGPL-3.0. This project uses [MuPDF](https://mupdf.com/licensing/) which is licensed under the GNU Affero General Public License.

## See Also

- [`datenlabor-bmz/redaction-ui`](https://github.com/datenlabor-bmz/redaction-ui) — standalone React component library (`@datenlabor-bmz/redaction-ui`) for PDF viewing and redaction, published to npm for use in other applications
- [`datenlabor-bmz/redaction-rules`](https://github.com/datenlabor-bmz/redaction-rules) — machine-readable FOI exemption rules by jurisdiction, fetched at runtime in FOI mode
