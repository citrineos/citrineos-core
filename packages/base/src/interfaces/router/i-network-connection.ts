// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { WebsocketServerConfig } from '@citrineos/types';

/**
 * Interface for the ocpp network connection
 */
export interface INetworkConnection {
  bindNetworkHook(): (identifier: string, message: string) => Promise<void>;

  disconnect(tenantId: number, ocppConnectionName: string): Promise<boolean>;

  shutdown(): Promise<void>;

  addWebsocketServer?(websocketServerConfig: WebsocketServerConfig): Promise<void>;

  reloadTlsCertificates?(serverId: string): Promise<void>;
}
