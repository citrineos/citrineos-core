// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { UTIL_CONFIG } from '@modules/config/config.tokens';
import type { UtilConfig } from '@modules/config/config.schema';
import { FileStorage } from '@file-storage/file-storage.token';

/**
 * Default `FileStorage` impl — writes to a configurable local directory.
 *
 * `id` is the relative path inside the storage root. `saveFile` returns
 * the id; `getFile` resolves it. Mirrors the legacy
 * `core/src/util/storage/local/DirectusFileStorage.ts` semantics for the
 * single-instance case.
 *
 * Configure via `config.util.fileStorage?.localPath` — defaults to
 * `./storage` relative to the process cwd if unset.
 */
@Injectable()
export class LocalFilesystemFileStorage implements FileStorage {
  private readonly logger = new Logger(LocalFilesystemFileStorage.name);
  private readonly root: string;

  constructor(@Inject(UTIL_CONFIG) util: UtilConfig) {
    const localPath =
      (util as unknown as { fileStorage?: { localPath?: string } }).fileStorage?.localPath ??
      './storage';
    this.root = path.resolve(localPath);
  }

  async saveFile(fileName: string, content: Buffer, filePath?: string): Promise<string> {
    const dir = filePath ? path.join(this.root, filePath) : this.root;
    await fs.mkdir(dir, { recursive: true });
    const id = filePath ? path.join(filePath, fileName) : fileName;
    await fs.writeFile(path.join(this.root, id), content);
    this.logger.debug(`Saved ${id} (${content.length} bytes)`);
    return id;
  }

  async getFile(id: string, filePath?: string): Promise<string | undefined> {
    const fullPath = filePath ? path.join(this.root, filePath, id) : path.join(this.root, id);
    try {
      const buf = await fs.readFile(fullPath);
      return buf.toString();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw err;
    }
  }
}
