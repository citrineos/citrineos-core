#  SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
#  SPDX-License-Identifier: Apache-2.0

FROM hasura/graphql-engine:v2.40.3.cli-migrations-v3

COPY Server/hasura-metadata/ /hasura-metadata/