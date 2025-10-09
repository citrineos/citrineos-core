# ---- build core ----
FROM node:22-alpine AS build
WORKDIR /app

# Copy everything (workspaces live across the repo)
COPY . .

# Install deps without a lockfile; make it workspace-aware
# (npm will read "workspaces" from the root package.json)
RUN npm install --workspaces

# Build all packages from the root (as per CitrineOS README)
RUN npm run build

# ---- runtime with Caddy reverse-proxy ----
FROM caddy:2.8.4-builder AS caddybuild
RUN xcaddy build --with github.com/caddyserver/replace-response

FROM node:22-alpine
WORKDIR /app

# Core runtime bits
COPY --from=build /app/Server /app/Server
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package*.json /app/

# Caddy
COPY --from=caddybuild /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile

ENV NODE_ENV=production

# Start Core (listens on 8080/8081/8082) AND Caddy (listens on 8080 and proxies)
CMD sh -lc "(cd /app/Server && npm run start &) && caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"
