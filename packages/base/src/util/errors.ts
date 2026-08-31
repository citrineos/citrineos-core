// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * How deep to walk nested error properties (`cause`, Sequelize's `parent`/`original`).
 * Deep enough to reach the driver-level diagnostics that actually name the failure,
 * shallow enough to keep a log line readable.
 */
const MAX_DEPTH = 3;

/**
 * Converts a thrown value into a plain object that survives JSON serialization.
 *
 * `Error` stores `name`, `message` and `stack` as non-enumerable properties, so any
 * logger that JSON-stringifies its arguments renders an error as `{}` — the message
 * is silently dropped, leaving nothing to diagnose. Passing errors through this
 * function first keeps them legible.
 *
 * Own enumerable properties are preserved too, since that is where libraries put
 * their diagnostics (Sequelize's `sql` and `table`, node-postgres' `code`, `detail`
 * and `constraint`, Ajv's `missingRef`). Recursion is depth-limited and guards
 * against cycles, so this is safe to call on an arbitrary caught value — including
 * inside a `catch` block, where throwing again would mask the original failure.
 *
 * @param error - The caught value. Non-objects are returned unchanged.
 * @returns A structure safe to hand to a JSON logger.
 */
export function serializeError(error: unknown): unknown {
  return serialize(error, 0, new WeakSet<object>());
}

function serialize(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return depth < MAX_DEPTH ? value.map((item) => serialize(item, depth + 1, seen)) : '[Array]';
  }

  const result: Record<string, unknown> = {};

  if (value instanceof Error) {
    result.name = value.name;
    result.message = value.message;
    if (value.stack) {
      result.stack = value.stack;
    }
  }

  if (depth >= MAX_DEPTH) {
    return result;
  }

  for (const key of Object.keys(value)) {
    // Never let an own property shadow the non-enumerable fields recovered above.
    if (key === 'name' || key === 'message' || key === 'stack') {
      continue;
    }
    result[key] = serialize((value as Record<string, unknown>)[key], depth + 1, seen);
  }

  // `cause` is non-enumerable when set via the Error constructor's options bag.
  const cause = (value as { cause?: unknown }).cause;
  if (cause !== undefined && result.cause === undefined) {
    result.cause = serialize(cause, depth + 1, seen);
  }

  return result;
}
