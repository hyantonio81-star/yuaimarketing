# SmartKPI Frontend - Vite dev server (개발용)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
EXPOSE 5173

# Docker Compose에서 proxy target은 env로 전달 (vite.config.js에서 사용)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
