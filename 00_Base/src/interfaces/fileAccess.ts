// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import * as Buffer from 'buffer';

export interface IFileAccess {
  uploadFile(fileName: string, content: Buffer, filePath?: string): Promise<string>;
  getFile(id: string): Promise<Buffer>;
}
