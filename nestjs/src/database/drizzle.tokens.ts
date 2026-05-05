// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { drizzle } from 'drizzle-orm/node-postgres';
import { schema } from '@db/schema';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_POOL = Symbol('PG_POOL');

/**
 * Type-aware Drizzle handle. The query builder (`db.query.boots`, etc.) is
 * generated from the schema map exported in `@db/schema`.
 */
export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
