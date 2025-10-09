# ---- build core ----
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
# Workspaces install (no root lockfile)
RUN npm install --workspaces
# Build all packages
RUN npm run build

# ---- grab a stock caddy binary (no plugins) ----
FROM caddy:2.9.1 AS caddybin

# ---- runtime: node + caddy ----
FROM node:22-alpine
WORKDIR /app

# Core runtime bits
COPY --from=build /app/Server /app/Server
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package*.json /app/

# Caddy binary + config
COPY --from=caddybin /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile

ENV NODE_ENV=production

# Start Core (listens on 8080/8081/8082) AND Caddy on 8080
CMD sh -lc "(cd /app/Server && npm run start &) && caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"
