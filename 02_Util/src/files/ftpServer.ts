// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IFileAccess } from '@citrineos/base';

export class FtpServer implements IFileAccess {
  getFileURL(): string {
    throw new Error('Method not implemented.');
  }
}
