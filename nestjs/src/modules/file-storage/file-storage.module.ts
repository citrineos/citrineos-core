// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Global, Module } from '@nestjs/common';
import { FILE_STORAGE } from '@file-storage/file-storage.token';
import { LocalFilesystemFileStorage } from '@file-storage/local-filesystem-file-storage.service';

/**
 * Durable file storage. `@Global()` so any module can inject
 * `@Inject(FILE_STORAGE) storage: FileStorage` without an explicit
 * import.
 *
 * Default impl is `LocalFilesystemFileStorage`. S3 / Directus / cloud
 * impls slot in by replacing the `useClass` here once they're ported
 * from the legacy `core/src/util/storage/`.
 */
@Global()
@Module({
  providers: [
    LocalFilesystemFileStorage,
    { provide: FILE_STORAGE, useExisting: LocalFilesystemFileStorage },
  ],
  exports: [FILE_STORAGE],
})
/**
 * NestJS DI module wiring the File Storage surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class FileStorageModule {}
