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

RUN pnpm --filter "@citrineos/ocpp-server" deploy --legacy --prod /deploy

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:24.16.0-slim


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

ENTRYPOINT ["/usr/local/apps/citrineos/apps/ocpp-server/entrypoint.sh"]
