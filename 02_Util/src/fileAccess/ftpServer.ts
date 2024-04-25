// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IFileAccess } from '@citrineos/base';

export class FtpServer implements IFileAccess {
  getFile(id: string): Promise<Buffer> {
    // TODO: implement the logic
    throw new Error(`Get file ${id} not yet implemented.`);
  }

  uploadFile(fileName: string, content: Buffer, filePath?: string): Promise<string> {
    // TODO: implement the logic
    throw new Error(
      `Upload file ${fileName} to ${filePath} with content ${content} not yet implemented.`,
    );
  }
}
