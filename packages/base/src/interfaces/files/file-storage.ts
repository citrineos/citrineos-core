// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Buffer } from 'node:buffer';

/**
 * Options that opt a storage call out of path-traversal validation.
 *
 *  Set trusted to true for internal, config-driven, or otherwise non-user-supplied paths
 */
export interface TrustOptions {
  trusted?: boolean;
}

export interface CreateDirectoryOptions extends TrustOptions {
  recursive?: boolean;
}

export interface DeleteFileOptions extends TrustOptions {
  recursive?: boolean;
  force?: boolean;
}

export interface IFileStorage {
  /**
   * Saves a file to storage.
   */
  saveFile(key: string, content: Buffer, bucket?: string, options?: TrustOptions): Promise<string>;

  /**
   * Retrieves a file from storage.
   */
  getFile(key: string, bucket?: string, options?: TrustOptions): Promise<string | undefined>;

  /**
   * Checks whether a file or directory exists at the given key.
   */
  exists(key: string, bucket?: string, options?: TrustOptions): Promise<boolean>;

  /**
   * Creates a directory at the given key.
   */
  createDirectory(key: string, bucket?: string, options?: CreateDirectoryOptions): Promise<void>;

  /**
   * Removes a file or directory at the given key.
   */
  deleteFile(key: string, bucket?: string, options?: DeleteFileOptions): Promise<void>;
}
