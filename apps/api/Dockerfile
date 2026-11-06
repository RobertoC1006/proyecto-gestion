FROM node:22-bookworm-slim@sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm ci
COPY apps/api/prisma ./prisma
RUN npm run prisma:generate

FROM base AS development
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
RUN mkdir -p /data/files && chown -R node:node /data
USER node
CMD ["npm", "run", "dev"]

FROM base AS build
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
RUN mkdir -p /data/files && chown -R node:node /data
USER node
CMD ["node", "dist/main.js"]
