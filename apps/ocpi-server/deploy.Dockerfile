#  SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
#  SPDX-License-Identifier: Apache-2.0

# Build context is the monorepo root (citrineos-core). @citrineos/base,
# @citrineos/core and @citrineos/ocpi-base are resolved as workspace packages,
# so there is no longer any tarball packing or cross-repo copying.
FROM --platform=${BUILDPLATFORM:-linux/amd64} node:24.16.0 AS build

RUN corepack enable

WORKDIR /usr/local/apps/citrineos

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@citrineos/ocpi-demo..." build

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:24.16.0-slim

RUN corepack enable

COPY --from=build /usr/local/apps/citrineos /usr/local/apps/citrineos

WORKDIR /usr/local/apps/citrineos/apps/ocpi-server

EXPOSE ${PORT}

CMD ["pnpm", "run", "start:docker:cloud"]
