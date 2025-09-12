#  SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
#  SPDX-License-Identifier: Apache-2.0

# Use a specific base image with platform support
FROM --platform=${BUILDPLATFORM:-linux/amd64} node:22 AS build

WORKDIR /usr/local/apps/citrineos

COPY . .
RUN npm run install-all && npm run build

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:22-slim
COPY --from=build /usr/local/apps/citrineos /usr/local/apps/citrineos

WORKDIR /usr/local/apps/citrineos

RUN chmod +x /usr/local/apps/citrineos/entrypoint.sh

EXPOSE ${PORT}

ENTRYPOINT ["/usr/local/apps/citrineos/entrypoint.sh"]
