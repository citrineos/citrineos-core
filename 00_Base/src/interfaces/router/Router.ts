// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IModule } from '../..';

/**
 * Interface for the ocpp router
 */
export interface IMessageRouter extends IModule {
  /**
   * Register a connection to the message handler with the given connection identifier.
   *
   * @param {string} connectionIdentifier - the identifier of the connection
   * @return {Promise<boolean>} true if both request and response subscriptions are successful, false otherwise
   */
  registerConnection(connectionIdentifier: string): Promise<boolean>;
  deregisterConnection(connectionIdentifier: string): Promise<boolean>;

  onMessage(identifier: string, message: string): Promise<boolean>;

  networkHook: (identifier: string, message: string) => Promise<boolean>;
}
