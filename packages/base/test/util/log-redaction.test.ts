// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { redactionMiddleware, type RedactionRule } from '@base-util/log-redaction.js';
import type { ILogObj, ISettings, LogContext } from 'tslog';
import { describe, expect, it } from 'vitest';

const SECRET = 'PIN#1234';
const PLACEHOLDER = '[***]';

/** The rule under test throughout: a `secret` field is redacted only when `type` says it is one. */
const siblingRule: RedactionRule = (node) =>
  node.type === 'secret' && typeof node.value === 'string' ? { value: PLACEHOLDER } : undefined;

/** Runs the middleware the way tslog does and hands back the rewritten args. */
function run(rules: readonly RedactionRule[], ...args: unknown[]): unknown[] {
  const context: LogContext<ILogObj> = {
    logLevelId: 3,
    logLevelName: 'INFO',
    args,
    settings: {} as ISettings<ILogObj>,
    meta: {},
  };
  const result = redactionMiddleware(rules)(context);
  expect(result).not.toBeNull();
  return (result as LogContext<ILogObj>).args;
}

describe('redactionMiddleware', () => {
  it('redacts a field whose sibling marks it a secret, and leaves its twin alone', () => {
    const [out] = run([siblingRule], {
      secret: { type: 'secret', value: SECRET },
      public: { type: 'public', value: 'cp-1' },
    }) as [Record<string, Record<string, unknown>>];

    expect(out.secret.value).toBe(PLACEHOLDER);
    // The same field name, the same shape — only `type` differs, which is the whole point.
    expect(out.public.value).toBe('cp-1');
  });

  it.each([
    ['nested in objects', { a: { b: { c: { type: 'secret', value: SECRET } } } }],
    ['inside an array', { entries: [{ type: 'secret', value: SECRET }] }],
    ['in an array of arrays', { entries: [[{ type: 'secret', value: SECRET }]] }],
    ['at the top level of an argument', { type: 'secret', value: SECRET }],
  ])('reaches a secret %s', (_case, arg) => {
    expect(JSON.stringify(run([siblingRule], arg))).not.toContain(SECRET);
  });

  it('redacts across every argument position, not just the first', () => {
    const args = run(
      [siblingRule],
      'received message',
      { payload: { type: 'secret', value: SECRET } },
      { props: { type: 'secret', value: SECRET } },
    );

    expect(JSON.stringify(args)).not.toContain(SECRET);
    expect(args[0]).toBe('received message');
  });

  it('never mutates what the caller logged', () => {
    // The args array holds the caller's live objects. Redacting in place would corrupt the request
    // being processed, not just the log line.
    const logged = { token: { type: 'secret', value: SECRET } };

    const [out] = run([siblingRule], logged);

    expect(logged.token.value).toBe(SECRET);
    expect(out).not.toBe(logged);
  });

  it('returns untouched values by reference so an ordinary log allocates nothing', () => {
    const untouched = { stationId: 'cp-1', evse: { id: 1 } };

    const [out] = run([siblingRule], untouched);

    expect(out).toBe(untouched);
  });

  it('clones only the path to the redacted field, sharing the rest', () => {
    const sibling = { unrelated: 'kept' };
    const logged = { sibling, secret: { type: 'secret', value: SECRET } };

    const [out] = run([siblingRule], logged) as [Record<string, unknown>];

    expect(out).not.toBe(logged);
    expect(out.sibling).toBe(sibling);
  });

  it('applies every rule, and each decides from the original values', () => {
    const first: RedactionRule = (node) => (node.a === 1 ? { a: 'redacted-a' } : undefined);
    const second: RedactionRule = (node) =>
      // Fires off `a`'s ORIGINAL value; it would not if the first rule's output were visible here.
      node.a === 1 ? { b: 'redacted-b' } : undefined;

    const [out] = run([first, second], { a: 1, b: 2 }) as [Record<string, unknown>];

    expect(out).toEqual({ a: 'redacted-a', b: 'redacted-b' });
  });

  it('does not descend into a value a rule already replaced', () => {
    const replaceWholeSubtree: RedactionRule = (node) =>
      'wrapper' in node ? { wrapper: PLACEHOLDER } : undefined;

    const [out] = run([replaceWholeSubtree], {
      wrapper: { type: 'secret', value: SECRET, deep: { type: 'secret', value: SECRET } },
    }) as [Record<string, unknown>];

    expect(out.wrapper).toBe(PLACEHOLDER);
  });

  it('terminates on a reference cycle', () => {
    const cyclic: Record<string, unknown> = { type: 'secret', value: SECRET };
    cyclic.self = cyclic;

    const [out] = run([siblingRule], cyclic) as [Record<string, unknown>];

    expect(out.value).toBe(PLACEHOLDER);
  });

  it('passes an Error through instead of flattening it to a plain object', () => {
    // tslog renders Errors specially, with their stack and cause; a clone would lose that.
    const error = new Error('boom');

    const [out] = run([siblingRule], error);

    expect(out).toBe(error);
  });

  it.each([
    ['a Date', new Date('2026-01-01T00:00:00.000Z')],
    ['a Map', new Map([['k', 'v']])],
    ['a Set', new Set(['v'])],
    ['a Buffer', Buffer.from('bytes')],
  ])('passes %s through by reference', (_case, value) => {
    expect(run([siblingRule], value)[0]).toBe(value);
  });

  it('leaves the context alone when no rules are configured', () => {
    const logged = { type: 'secret', value: SECRET };

    const [out] = run([], logged);

    expect(out).toBe(logged);
  });

  it('stops descending at a depth bound rather than following a runaway structure', () => {
    // Nothing legitimate nests this far; the bound is here so a pathological value cannot turn a
    // log call into a hang.
    let deep: Record<string, unknown> = { type: 'secret', value: SECRET };
    for (let i = 0; i < 50; i++) {
      deep = { nested: deep };
    }

    expect(() => run([siblingRule], deep)).not.toThrow();
  });
});
