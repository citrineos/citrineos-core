// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj, LogMiddleware } from 'tslog';

/**
 * A rule that decides what to strip from one object inside a logged value.
 *
 * Most redaction needs no rule: naming a property in `logRedaction.keys`, or a path or pattern, is
 * enough, and those are configuration rather than code. A rule is for the cases that configuration
 * cannot express — where whether a value is a secret depends on the object *around* it. An OCPP
 * `idToken` is the example: the same field is a public tag id or a driver's PIN depending on its
 * sibling `type`, so no list of property names can tell them apart.
 *
 * A rule is given one plain object and returns the fields to replace on it, or `undefined` to leave
 * it alone. It sees only that object's own properties — the walk visits nested objects separately,
 * so a rule never recurses itself.
 *
 * @param node - the object being visited. Treat it as read-only: it belongs to the caller that
 *   logged it, and mutating it would corrupt application state rather than just the log line.
 * @returns the properties to override, or `undefined` to leave the object as it is.
 */
export type RedactionRule = (
  node: Readonly<Record<string, unknown>>,
) => Record<string, unknown> | undefined;

/**
 * How deep the walk goes before it stops descending. Deep enough for any OCPP message; a bound at
 * all matters because this runs inside the logger, where a pathological value must not become a
 * hang.
 */
const MAX_DEPTH = 24;

/**
 * The depth from which the walk starts tracking the objects it is inside, to break reference cycles
 * and to stop a shared reference being re-walked once per path that reaches it.
 */
const CYCLE_GUARD_DEPTH = 8;

/**
 * Values that are passed through untouched rather than walked: a rule has no business rewriting
 * them, and rebuilding one as a plain object would lose what makes it useful in a log line.
 * `Error`s in particular carry their own stack and `cause`, which tslog renders specially.
 */
function isOpaque(value: object): boolean {
  return (
    value instanceof Error ||
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Map ||
    value instanceof Set ||
    value instanceof URL ||
    ArrayBuffer.isView(value) ||
    value instanceof ArrayBuffer
  );
}

/**
 * Walk `value`, applying `rules` to every plain object in it, and return the redacted result.
 *
 * Copy-on-write: a subtree that no rule touched is returned by reference, so a log with nothing to
 * redact — the overwhelming majority — allocates nothing. Only the objects on the path to a
 * redacted field are cloned, which is also what keeps the caller's own objects unmodified.
 *
 * @param ancestors - the objects currently being visited, used to break reference cycles.
 */
function redactValue(
  value: unknown,
  rules: readonly RedactionRule[],
  ancestors: Set<object>,
  depth: number,
): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (depth >= MAX_DEPTH) {
    return value;
  }

  // Ordered for the node this actually sees: an object straight out of JSON.parse, or an array.
  // Only something more exotic than those pays for the checks in `isOpaque`.
  const asArray = Array.isArray(value) ? (value as unknown[]) : undefined;
  if (asArray === undefined) {
    const proto = Object.getPrototypeOf(value) as object | null;
    if (proto !== Object.prototype && proto !== null && isOpaque(value)) {
      return value;
    }
  }

  const guarded = depth >= CYCLE_GUARD_DEPTH;
  if (guarded) {
    // Already inside this object further up, where its own fields are redacted. Returning it here
    // terminates the descent instead of recurring forever.
    if (ancestors.has(value)) {
      return value;
    }
    ancestors.add(value);
  }

  let result: unknown;

  if (asArray !== undefined) {
    let clone: unknown[] | undefined;
    for (let i = 0; i < asArray.length; i++) {
      const next = redactValue(asArray[i], rules, ancestors, depth + 1);
      if (next !== asArray[i] && clone === undefined) {
        clone = asArray.slice(0, i);
      }
      clone?.push(next);
    }
    result = clone ?? asArray;
  } else {
    const node = value as Record<string, unknown>;

    // Rules run against the object as it was logged, so one rule cannot see another's replacement
    // and every rule decides from the original values.
    let overrides: Record<string, unknown> | undefined;
    for (const rule of rules) {
      const fields = rule(node);
      if (fields !== undefined) {
        overrides = overrides === undefined ? { ...fields } : { ...overrides, ...fields };
      }
    }

    let clone: Record<string, unknown> | undefined =
      overrides === undefined ? undefined : { ...node, ...overrides };

    for (const key of Object.keys(node)) {
      // A field a rule already replaced is not descended into: the replacement is the final value.
      if (overrides !== undefined && key in overrides) {
        continue;
      }
      const next = redactValue(node[key], rules, ancestors, depth + 1);
      if (next !== node[key]) {
        clone ??= { ...node };
        clone[key] = next;
      }
    }

    result = clone ?? node;
  }

  if (guarded) {
    ancestors.delete(value);
  }
  return result;
}

/**
 * Middleware that applies `rules` to every value handed to the logger.
 *
 * Register it on the root logger and every sub-logger below inherits it, so a rule cannot be
 * forgotten at a call site — which is the point. It runs before tslog's own masking, so the two
 * compose: rules handle what depends on an object's shape, `logRedaction.keys` / `paths` /
 * `patterns` handle what can be named.
 *
 * @param rules - the rules to apply. An empty list yields a middleware that does nothing, so a
 *   deployment that configures no rules pays only a function call per log.
 */
export function redactionMiddleware(rules: readonly RedactionRule[]): LogMiddleware<ILogObj> {
  const active = [...rules];
  if (active.length === 0) {
    return (context) => context;
  }
  return (context) => {
    const ancestors = new Set<object>();
    context.args = context.args.map((arg) => redactValue(arg, active, ancestors, 0));
    return context;
  };
}
