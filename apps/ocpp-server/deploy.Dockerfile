#  SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
#  SPDX-License-Identifier: Apache-2.0

# Use a specific base image with platform support
FROM --platform=${BUILDPLATFORM:-linux/amd64} node:24.16.0 AS build

RUN corepack enable

WORKDIR /usr/local/apps/citrineos

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@citrineos/ocpp-server..." build

# Prune to a production-only bundle of ocpp-server + its workspace deps.
# The old COPY-everything approach shipped the whole monorepo with every
# package's devDependencies (~1.7Gi); `pnpm deploy` keeps only what the
# ocpp-server actually needs at runtime. --legacy: pnpm 10 requires either
# injected workspace packages or this flag for deploy.
RUN pnpm --filter "@citrineos/ocpp-server" deploy --legacy --prod /deploy

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:24.16.0-slim

# no corepack in the final image: the entrypoint calls
# ./node_modules/.bin/sequelize-cli directly, so nothing needs pnpm (or a
# network fetch of it) at runtime.

COPY --from=build /deploy /usr/local/apps/citrineos/apps/ocpp-server
# pnpm deploy honours the package's `files` list (["dist"]), so runtime files
# living outside dist/ must be copied explicitly.
COPY --from=build /usr/local/apps/citrineos/apps/ocpp-server/entrypoint.sh /usr/local/apps/citrineos/apps/ocpp-server/entrypoint.sh
COPY --from=build /usr/local/apps/citrineos/apps/ocpp-server/.sequelizerc /usr/local/apps/citrineos/apps/ocpp-server/.sequelizerc
# static assets read from the image by k8s (hasura's copy-metadata initContainer)
# and potentially by the app at runtime (rbac rules) — not part of dist/.
COPY --from=build /usr/local/apps/citrineos/apps/ocpp-server/db/hasura-metadata /usr/local/apps/citrineos/apps/ocpp-server/db/hasura-metadata
COPY --from=build /usr/local/apps/citrineos/apps/ocpp-server/rbac-rules.json /usr/local/apps/citrineos/apps/ocpp-server/rbac-rules.json

WORKDIR /usr/local/apps/citrineos/apps/ocpp-server

RUN chmod +x /usr/local/apps/citrineos/apps/ocpp-server/entrypoint.sh

EXPOSE 8080

# The slim image ships only dist/ (pnpm deploy honours files:["dist"]). The build's
# copy-assets step places the runtime assets (websocket-servers.json, logo, TLS
# material) at dist/assets, so point the fileAccess root there — the fat image
# defaulted to src/assets, which is not present in the pruned bundle. Still
# overridable at runtime (k8s env / -e).
ENV CITRINEOS_FILEACCESS_LOCAL_DEFAULTFILEPATH=dist/assets \
    CITRINEOS_SWAGGER_LOGOPATH=dist/assets/logo.png

# Deployed at the SAME path as the fat image (apps/ocpp-server) so every
# existing k8s manifest command (cd .../apps/ocpp-server && node dist/...)
# keeps working — the slim image is a drop-in tag swap.
ENTRYPOINT ["/usr/local/apps/citrineos/apps/ocpp-server/entrypoint.sh"]
