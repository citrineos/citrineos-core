// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Interface for the ocpp network connection
 */
export interface INetworkConnection {
  bindNetworkHook(): (identifier: string, message: string) => Promise<void>;

  disconnectWebsocketConnection(tenantId: number, stationId: string): Promise<boolean>;

  shutdown(): Promise<void>;
}
