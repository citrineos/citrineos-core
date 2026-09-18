#  SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
#  SPDX-License-Identifier: Apache-2.0

# Build context is the monorepo root (citrineos-core). @citrineos/base,
# @citrineos/ocpp and @citrineos/ocpi are resolved as workspace packages,
# so there is no longer any tarball packing or cross-repo copying.
FROM --platform=${BUILDPLATFORM:-linux/amd64} node:24.16.0 AS build

RUN corepack enable

WORKDIR /usr/local/apps/citrineos

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@citrineos/ocpi-demo..." build

# Prune to a production-only bundle of ocpi-server + its workspace deps —
# same slim formula as apps/ocpp-server/deploy.Dockerfile. --legacy: pnpm 10
# requires either injected workspace packages or this flag for deploy.
# (The app's package name is @citrineos/ocpi-demo, not ocpi-server.)
# `pnpm deploy` honours the package's `files` list (["dist"]), so the compiled
# dist/ — including dist/assets (logo + certificates from copy-assets),
# dist/migrations and dist/seeders — ships automatically. The directus
# `data/` uploads are consumed by the separate directus service, not this
# node image, so they are intentionally not copied here.
RUN pnpm --filter "@citrineos/ocpi-demo" deploy --legacy --prod /deploy

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:24.16.0-slim

# no corepack in the final image: the entrypoint calls
# ./node_modules/.bin/sequelize-cli directly, so nothing needs pnpm (or a
# network fetch of it) at runtime.

COPY --from=build /deploy /usr/local/apps/citrineos/apps/ocpi-server
# pnpm deploy honours the package's `files` list (["dist"]), so runtime files
# living outside dist/ must be copied explicitly.
COPY --from=build /usr/local/apps/citrineos/apps/ocpi-server/entrypoint.sh /usr/local/apps/citrineos/apps/ocpi-server/entrypoint.sh
COPY --from=build /usr/local/apps/citrineos/apps/ocpi-server/.sequelizerc /usr/local/apps/citrineos/apps/ocpi-server/.sequelizerc

WORKDIR /usr/local/apps/citrineos/apps/ocpi-server

RUN chmod +x /usr/local/apps/citrineos/apps/ocpi-server/entrypoint.sh

# ocpiServer.port is hardcoded in src/config/envs/* (the README's PORT var is
# not read) — override with CITRINEOS_OCPI_OCPISERVER_PORT if ever needed.
EXPOSE 8085

# Deployed at the SAME path as the fat image (apps/ocpi-server) so k8s manifest
# commands (cd .../apps/ocpi-server && node dist/...) work — drop-in tag swap.
# The entrypoint runs db:migrate then the app; deployments may override the
# command to skip migrate (e.g. when migrations run once in a separate Job).
ENTRYPOINT ["/usr/local/apps/citrineos/apps/ocpi-server/entrypoint.sh"]
