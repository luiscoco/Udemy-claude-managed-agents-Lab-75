# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    LEARNING_HOST=0.0.0.0 \
    LEARNING_API_PORT=8080 \
    LEARNING_SERVE_STATIC=true
# Source stays available to the lesson inspector and starter ZIP downloads.
# tsx and lab adapters need the current installed development dependencies.
COPY --from=build --chown=node:node /app /app
RUN mkdir -p artifacts sessions workspaces logs && chown -R node:node artifacts sessions workspaces logs
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "--import", "tsx", "server/index.ts"]
