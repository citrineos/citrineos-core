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

# Copy server, node_modules, package metadata
COPY --from=build /app/Server /app/Server
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package*.json /app/

# 👇 Add these lines so workspace symlinks resolve:
COPY --from=build /app/00_Base /app/00_Base
COPY --from=build /app/01_Data /app/01_Data
COPY --from=build /app/02_Util /app/02_Util
COPY --from=build /app/03_Modules /app/03_Modules

# Caddy binary + config
COPY --from=caddybin /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile

# (optional) writable data dir for bootstrap file access
RUN mkdir -p /data
ENV BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE=local \
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH=/data \
    NODE_ENV=production

# Use the direct JS entrypoint (no nodemon/tsc at runtime)
CMD /bin/sh -lc "caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile \
  && (node /app/Server/dist/index.js &) \
  && caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"
