// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Buffer } from 'node:buffer';

export interface IFileStorage {
  /**
   *
   * @param fileName Name of the file
   * @param content File content
   * @param filePath The path of the file, if not in root. Used as the bucket name for S3.
   *
   * @returns The ID of the file
   */
  saveFile(fileName: string, content: Buffer, filePath?: string): Promise<string>;

  /**
   *
   * @param id The ID of the file
   * @param filePath The path of the file, if not included in the ID. Used as the bucket name for S3.
   *
   * @returns The file content
   */
  getFile(id: string, filePath?: string): Promise<string | undefined>;
}
