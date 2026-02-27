# ── Build stage ──
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$BASE_PATH
ENV NEXT_PUBLIC_SPACY_ENABLED=true

RUN npm run build

# ── Runtime stage ──
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/messages ./messages
COPY --from=build /app/scripts ./scripts

ENV NODE_ENV=production
ENV LIBREOFFICE_PATH=/usr/bin/libreoffice
ENV SPACY_ENABLED=true
ENV PORT=3000

EXPOSE 3000
CMD ["node", "server.js"]
