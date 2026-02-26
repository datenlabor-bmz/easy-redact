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

# Install Node deps (all, including devDeps needed for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Subpath support (e.g. /easyredact for datenlabor.bmz.bund.de/easyredact/)
ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$BASE_PATH

# Build Next.js
RUN npm run build

# Pre-cache uv env + spaCy model by running the script against empty input
RUN echo '[]' | uv run scripts/spacy_nlp.py

ENV NODE_ENV=production
ENV LIBREOFFICE_PATH=/usr/bin/libreoffice
ENV SPACY_ENABLED=true
ENV PORT=3000

EXPOSE 3000
CMD ["npm", "start"]
