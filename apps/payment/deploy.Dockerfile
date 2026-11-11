#  SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
#  SPDX-License-Identifier: Apache-2.0

# Build context is the monorepo root (citrineos-core).
FROM --platform=${BUILDPLATFORM:-linux/amd64} node:24.16.0 AS build

RUN corepack enable

WORKDIR /usr/local/apps/citrineos

COPY . .
RUN pnpm install --frozen-lockfile
# Builds the driver pages too: @citrineos/payment-frontend is one of the payment server's dependencies.
RUN pnpm --filter "@citrineos/payment..." build

RUN pnpm --filter "@citrineos/payment" deploy --legacy --prod /deploy

FROM node:24.16.0-slim

COPY --from=build /deploy /usr/local/apps/citrineos/apps/payment
# pnpm deploy honours the package's `files` list (["dist"]), so runtime files
# living outside dist/ must be copied explicitly.
COPY --from=build /usr/local/apps/citrineos/apps/payment/entrypoint.sh /usr/local/apps/citrineos/apps/payment/entrypoint.sh
COPY --from=build /usr/local/apps/citrineos/apps/payment/.sequelizerc /usr/local/apps/citrineos/apps/payment/.sequelizerc
# The driver pages, where the server looks for them by default.
COPY --from=build /usr/local/apps/citrineos/apps/payment/frontend/dist /usr/local/apps/citrineos/apps/payment/frontend/dist

WORKDIR /usr/local/apps/citrineos/apps/payment

RUN chmod +x /usr/local/apps/citrineos/apps/payment/entrypoint.sh

EXPOSE 9010

ENTRYPOINT ["/usr/local/apps/citrineos/apps/payment/entrypoint.sh"]
