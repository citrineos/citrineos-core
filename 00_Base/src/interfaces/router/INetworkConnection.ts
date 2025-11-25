// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { WebsocketServerConfig } from '../../config/types.js';

/**
 * Interface for the ocpp network connection
 */
export interface INetworkConnection {
  bindNetworkHook(): (identifier: string, message: string) => Promise<void>;

  disconnect(tenantId: number, stationId: string): Promise<boolean>;

  shutdown(): Promise<void>;

  addWebsocketServer(websocketServerConfig: WebsocketServerConfig): Promise<void>;
}
