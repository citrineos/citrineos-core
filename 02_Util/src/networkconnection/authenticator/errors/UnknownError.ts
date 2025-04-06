// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Duplex } from 'stream';
import { IUpgradeError } from './IUpgradeError';

export class UpgradeUnknownError extends Error implements IUpgradeError {
  constructor(message: string) {
    super(message);
    this.name = 'UpgradeUnknownError';
  }

  terminateConnection(socket: Duplex): boolean {
    try {
      socket.write('HTTP/1.1 404 Not Found\r\n');
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
