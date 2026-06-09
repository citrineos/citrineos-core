// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Buffer } from 'node:buffer';

export interface IFileStorage {
  /**
   *
   * @param fileId  Relative storage key (e.g. `certs/leaf.pem`).
   * @param content File content
   *
   * @returns The ID of the file
   */
  saveFile(fileId: string, content: Buffer): Promise<string>;

  /**
   *
   * @param fileId Relative storage key
   *
   * @returns The file content
   */
  getFile(fileId: string): Promise<string | undefined>;

  /**
   * Check whether a file or directory exists at `fileId`.
   *
   * @param fileId The file or directory path. For object storage (S3, GCP), treated as an object key or prefix.
   */
  exists(fileId: string): Promise<boolean>;

  /**
   * Create a directory at `fileId`.
   * For object storage backends (S3, GCP) this may be a no-op since directories are implicit.
   *
   * @param fileId  Directory path (local) or prefix (bucket).
   * @param options Optional options, e.g. `{ recursive: true }`.
   */
  createDirectory(fileId: string, options?: { recursive?: boolean }): Promise<void>;

  /**
   * Remove the file or directory at `fileId`.
   * For object storage backends (S3, GCP), recursive removal deletes all objects sharing the path prefix.
   *
   * @param fileId  Relative storage key or prefix.
   * @param options Optional options, e.g. `{ recursive: true, force: true }`.
   */
  deleteFile(fileId: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
}
