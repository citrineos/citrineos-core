// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Durable file content keyed by id. Mirrors legacy
 * `base/src/interfaces/files/fileStorage.ts:IFileStorage`.
 *
 * Used for cert PEM blobs (signed meter value verification, V2G CA),
 * firmware bundles, and any other content that needs operator-supplied
 * persistence outside of Postgres.
 *
 * Implementations are bound under the `FILE_STORAGE` injection token.
 */
export interface FileStorage {
  /**
   * Persist a file and return its id (the implementation chooses the id
   * format — local FS uses the path; S3 uses the object key).
   *
   * @param fileName  Display name; the impl may incorporate it into the id.
   * @param content   Buffer of file content.
   * @param filePath  Optional bucket / sub-directory.
   */
  saveFile(fileName: string, content: Buffer, filePath?: string): Promise<string>;

  /**
   * Read the file by id. Returns `undefined` when the file isn't present —
   * callers must handle the missing-file case explicitly.
   */
  getFile(id: string, filePath?: string): Promise<string | undefined>;
}

/** Multi-bind injection token: `@Inject(FILE_STORAGE) storage: FileStorage`. */
export const FILE_STORAGE = Symbol('FILE_STORAGE');
