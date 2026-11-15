# IT Set Desk — Team Edition — © 2026 Abdullah Amer. Proprietary, see LICENSE.
# Zero npm dependencies: Node.js built-in HTTP + SQLite (node:sqlite, requires Node >= 22.13)
# Exact version pinned on purpose: node:sqlite is still experimental in Node 22, so the runtime
# must never change silently on rebuild. Upgrade deliberately, then run: node --test tests/api.test.js
FROM node:22.22.0-alpine

LABEL org.opencontainers.image.title="IT Set Desk" \
      org.opencontainers.image.description="Bilingual (AR/EN) IT ticketing system with portal (Node.js + SQLite)" \
      org.opencontainers.image.version="3.4.0" \
      org.opencontainers.image.authors="Abdullah Amer <abdo11amer@gmail.com>" \
      org.opencontainers.image.licenses="LicenseRef-Proprietary"

ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data

WORKDIR /app
COPY --chown=node:node server.js backup.js reset-password.js LICENSE ./
COPY --chown=node:node lib/ ./lib/
COPY --chown=node:node public/ ./public/
RUN mkdir -p /data && chown node:node /data

USER node
EXPOSE 8080
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["node", "server.js"]
