// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Buffer } from 'node:buffer';

export interface IFileStorage {
  /**
   * Saves a file to storage.
   */
  saveFile(key: string, content: Buffer, bucket?: string): Promise<string>;

  /**
   * Retrieves a file from storage.
   */
  getFile(key: string, bucket?: string): Promise<string | undefined>;

  /**
   * Checks whether a file or directory exists at the given key.
   */
  exists(key: string, bucket?: string): Promise<boolean>;

  /**
   * Creates a directory at the given key.
   */
  createDirectory(key: string, bucket?: string, options?: { recursive?: boolean }): Promise<void>;

  /**
   * Removes a file or directory at the given key.
   */
  deleteFile(
    key: string,
    bucket?: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void>;
}
