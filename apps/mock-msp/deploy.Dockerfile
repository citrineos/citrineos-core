#  SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
#  SPDX-License-Identifier: Apache-2.0

# Optional container image for the mock eMSP (@citrineos/mock-msp).
#
# Node can run this app directly (see apps/mock-msp/README.md), so this image is
# only for the containerized workflow (docker-compose.local.yml `mock-msp`
# service). Build context is the monorepo root (citrineos-core): @citrineos/base,
# @citrineos/core and @citrineos/ocpi-base resolve as workspace packages.
#
# The mock REUSES @citrineos/ocpi-base's compiled Zod schemas (its dist/ must
# exist before the mock runs). `pnpm --filter "@citrineos/mock-msp..."` builds
# the whole dependency closure (base -> core -> ocpi-base -> mock-msp) in
# topological order, guaranteeing those dist/ outputs are present.
FROM --platform=${BUILDPLATFORM:-linux/amd64} node:24.16.0 AS build

RUN corepack enable

WORKDIR /usr/local/apps/citrineos

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@citrineos/mock-msp..." build

# The final stage: copy built files and prepare the run environment.
# Using a slim image to reduce the final image size.
FROM node:24.16.0-slim

RUN corepack enable

COPY --from=build /usr/local/apps/citrineos /usr/local/apps/citrineos

WORKDIR /usr/local/apps/citrineos/apps/mock-msp

EXPOSE 8083

CMD ["pnpm", "run", "start"]
