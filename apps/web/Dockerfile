FROM node:22-bookworm-slim@sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d AS development
WORKDIR /app
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ ./
RUN mkdir -p /app/node_modules/.vite /app/node_modules/.vite-temp && chown node:node /app /app/node_modules/.vite /app/node_modules/.vite-temp
USER node
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

FROM development AS build
RUN npm run build

FROM nginx:stable-alpine@sha256:583b7f2fce1cdb8da5ad5c39ebd3c33b98b87d493190e548bdee1fa8c619c311 AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
