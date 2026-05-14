# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN npm ci

FROM deps AS build
COPY apps/api apps/api
COPY apps/worker apps/worker
RUN npm run api:build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]

