# ------------ Build stage ------------
FROM node:18 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY src/docs ./src/docs
RUN npm run build

# ------------ Runtime stage ------------
FROM node:18
WORKDIR /usr/src/app
# Instala as dependências nativas requisitadas (usadas por dependências como puppeteer/electron)
RUN apt-get update && apt-get install -y \
  libnss3 libnspr4 \
  libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2 libxshmfence1 \
  libpango-1.0-0 libpangocairo-1.0-0 \
  fonts-liberation ca-certificates \
  wget gnupg \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/src/docs ./dist/docs
COPY .env.example ./.env.example
EXPOSE 4000
CMD ["node", "dist/main.js"]