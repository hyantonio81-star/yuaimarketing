# Backend API with FFmpeg (Railway, Fly.io, VPS). Not applicable to Vercel serverless.
# Build from monorepo root: docker build -f backend/Dockerfile .
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/server.js"]
