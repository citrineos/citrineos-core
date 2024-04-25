// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IFileAccess } from '@citrineos/base';

export class FtpServer implements IFileAccess {
  getFile(id: string): Promise<Buffer> {
    // TODO: implement the logic
    throw new Error(`Get file ${id} not yet implemented.`);
  }

  uploadFile(filePath: string, content: Buffer): Promise<string> {
    // TODO: implement the logic
    throw new Error(
      `Upload file ${filePath} with content ${content} not yet implemented.`,
    );
  }
}
