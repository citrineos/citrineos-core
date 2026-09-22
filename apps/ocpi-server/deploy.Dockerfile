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
RUN pnpm --filter "@citrineos/ocpi-server..." build

RUN pnpm --filter "@citrineos/ocpi-demo" deploy --legacy --prod /deploy

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:24.16.0-slim


COPY --from=build /deploy /usr/local/apps/citrineos/apps/ocpi-server
# pnpm deploy honours the package's `files` list (["dist"]), so runtime files
# living outside dist/ must be copied explicitly.
COPY --from=build /usr/local/apps/citrineos/apps/ocpi-server/entrypoint.sh /usr/local/apps/citrineos/apps/ocpi-server/entrypoint.sh
COPY --from=build /usr/local/apps/citrineos/apps/ocpi-server/.sequelizerc /usr/local/apps/citrineos/apps/ocpi-server/.sequelizerc

WORKDIR /usr/local/apps/citrineos/apps/ocpi-server

RUN chmod +x /usr/local/apps/citrineos/apps/ocpi-server/entrypoint.sh

ENTRYPOINT ["/usr/local/apps/citrineos/apps/ocpi-server/entrypoint.sh"]
