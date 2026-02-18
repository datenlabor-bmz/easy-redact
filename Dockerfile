FROM node:22-slim AS base

# Install LibreOffice, uv, and Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Install Node deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Pre-download spaCy model at build time
RUN uv run python -c "import spacy; spacy.cli.download('de_core_news_lg')" 2>/dev/null || true

# Build Next.js
RUN npm run build

ENV NODE_ENV=production
ENV LIBREOFFICE_PATH=/usr/bin/libreoffice
ENV SPACY_ENABLED=true
ENV PORT=3000

EXPOSE 3000
CMD ["node", "server.js"]
