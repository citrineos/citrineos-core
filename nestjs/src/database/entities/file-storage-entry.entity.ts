// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { TableName } from '@db/table-names';
import { tenants } from '@entities/tenant.entity';

/**
 * DB-backed file metadata when LocalFilesystem isn't enough (e.g.
 * multi-instance deployments). The actual file content can either:
 *   - live in the local FS at `path`, or
 *   - live inline in `content` for small artifacts (PEMs, configs), or
 *   - live in S3 / external storage with `path` as the object key.
 *
 * Mirrors legacy `core/src/dal/layers/sequelize/model/FileStorageEntry.ts`.
 *
 * `id` (the FileStorage logical id) is unique per tenant — mirrors how
 * SignedMeterValuesConfig and ChargingStationSecurityInfo refer to file
 * blobs by string id.
 */
export const fileStorageEntries = pgTable(
  TableName.FileStorageEntries,
  {
    id: serial('id').primaryKey(),
    /** Logical id — what other entities reference (e.g. `publicKeyFileId`). */
    fileId: varchar('fileId', { length: 500 }).notNull(),
    fileName: varchar('fileName', { length: 500 }),
    /** Local FS path or S3 object key. Null when content is inline. */
    path: varchar('path', { length: 1000 }),
    /** Inline content for small artifacts. Null when stored externally. */
    content: text('content'),
    contentType: varchar('contentType', { length: 128 }),
    sizeBytes: integer('sizeBytes'),
    tenantId: integer('tenantId')
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index('file_storage_entries_file_id_idx').on(t.fileId),
    uniqueIndex('file_storage_entries_file_id_tenant').on(t.fileId, t.tenantId),
  ],
);

export type FileStorageEntry = typeof fileStorageEntries.$inferSelect;
export type NewFileStorageEntry = typeof fileStorageEntries.$inferInsert;
