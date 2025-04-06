// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Duplex } from 'stream';
import { IUpgradeError } from './IUpgradeError';

export class UpgradeAuthenticationError extends Error implements IUpgradeError {
  constructor(message: string) {
    super(message);
    this.name = 'UpgradeAuthenticationError';
  }

  terminateConnection(socket: Duplex): boolean {
    try {
      socket.write('HTTP/1.1 401 Unauthorized\r\n');
      socket.write('WWW-Authenticate: Basic realm="Access to the WebSocket", charset="UTF-8"\r\n');
      socket.write('\r\n');
      socket.end();
      socket.destroy();
      return true;
    } catch (error) {
      this.message = (error as Error).message;
      return false;
    }
  }
}
