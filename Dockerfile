# ---- build core ----
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

# ---- runtime with caddy as reverse-proxy ----
FROM caddy:2.8.4-builder AS caddybuild
RUN xcaddy build --with github.com/caddyserver/replace-response

FROM node:22-alpine
WORKDIR /app

# Core runtime bits
COPY --from=build /app/Server /app/Server
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package*.json /app/

# Caddy binaries & config
COPY --from=caddybuild /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile

ENV NODE_ENV=production
# Run both: Core server + Caddy
# Core listens on 8080/8081/8082; Caddy listens on 8080 and proxies by path.
CMD sh -lc "node -v && (cd /app/Server && npm run start &) && caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"
