// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/** The Postgres error codes (SQLSTATE) the repositories turn into errors of their own. */
const PgErrorCode = {
  ForeignKeyViolation: '23503',
  UniqueViolation: '23505',
} as const;

/** A row names another that does not exist, e.g. a payment account for a tenant Core lacks. */
export class ForeignKeyViolationError extends Error {
  override readonly name = 'ForeignKeyViolationError';
}

/** A value that has to be unique is taken, e.g. a Stripe account another tenant has. */
export class UniqueViolationError extends Error {
  override readonly name = 'UniqueViolationError';
}

/** The SQLSTATE of a database error, which Drizzle wraps in errors of its own. */
function sqlState(error: unknown): string | undefined {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ('code' in current && typeof current.code === 'string') {
      return current.code;
    }
  }
  return undefined;
}

/**
 * Runs a write, turning the constraint violations callers act on into this module's errors, so
 * they do not depend on the database driver's.
 */
export async function translateConstraintErrors<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    switch (sqlState(error)) {
      case PgErrorCode.ForeignKeyViolation:
        throw new ForeignKeyViolationError(message, { cause: error });
      case PgErrorCode.UniqueViolation:
        throw new UniqueViolationError(message, { cause: error });
      default:
        throw error;
    }
  }
}
