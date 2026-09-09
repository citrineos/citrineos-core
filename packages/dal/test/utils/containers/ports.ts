// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Ports the spawned CitrineOS server listens on. Single source of truth: setup.ts writes
 * the websocket servers config from WS_PORT, the OCPP client connects to it, and
 * server.ts polls HTTP_PORT for readiness.
 */

/** Fastify API + /health. `config.port`, whose schema default is 8080. */
export const HTTP_PORT = 8080;

/** OCPP WebSocket — the port of the single server in websocket-servers.json. */
export const WS_PORT = 8081;
