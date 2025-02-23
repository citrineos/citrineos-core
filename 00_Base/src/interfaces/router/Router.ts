// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IModule } from '../..';

/**
 * Interface for the ocpp router
 */
export interface IMessageRouter extends IModule {
  networkHook: (identifier: string, message: string) => Promise<void>;

  /**
   * Register a connection to the message handler with the given connection identifier.
   *
   * @param {string} connectionIdentifier - the identifier of the connection
   * @return {Promise<boolean>} true if both request and response subscriptions are successful, false otherwise
   */
  registerConnection(connectionIdentifier: string): Promise<boolean>;
  deregisterConnection(connectionIdentifier: string): Promise<boolean>;

  /**
   * Receive a message from the Network Connection.
   * Timestamp here should be when the message was received from the charger.
   * If CitrineOS is running behind cloud infrastructure, it is optimal for the timestamp to be generated when the infrastructure receives the message rather than when CitrineOS is first notified.
   * Otherwise lag or outages could result in a desync, causing CitrineOS to process messages as if they had been generated long after the charging station actually sent them.
   *
   * @param identifier Unique identifier for the charging station, i.e. the stationId
   * @param message The unvalidated, raw OCPP text, i.e. [2, "123", "Heartbeat", {}]
   * @param timestamp Time at which the message was received from the charger.
   * @param protocol The OCPP protocol version of the message
   * @returns true if the message was successfully processed, false otherwise
   */
  onMessage(
    identifier: string,
    message: string,
    timestamp: Date,
    protocol: string,
  ): Promise<boolean>;
}
