// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AsyncLocalStorage } from 'node:async_hooks';
import type { LoggerService, LogLevel } from '@nestjs/common';

/**
 * Per-request correlation context. Handlers / services that originate
 * an OCPP frame put `correlationId` here at the start of processing;
 * every log line emitted while that work is on the stack picks it up
 * automatically.
 *
 * Mirrors the legacy server's `requestContextId` propagation but uses
 * Node's `AsyncLocalStorage` (zero-cost on inactive slots, no manual
 * threading through every method).
 */
export interface LogContext {
  correlationId?: string;
  stationId?: string;
  tenantId?: number;
  /** Free-form per-request fields. */
  extra?: Record<string, unknown>;
}

const logContext = new AsyncLocalStorage<LogContext>();

/**
 * Run `fn` with the supplied log context. Every log line emitted under
 * this Promise chain will carry the context fields automatically.
 */
export const withLogContext = <T>(ctx: LogContext, fn: () => Promise<T> | T): Promise<T> | T =>
  logContext.run(ctx, fn);

/** Read the active log context (returns `{}` outside an `withLogContext` scope). */
export const getLogContext = (): LogContext => logContext.getStore() ?? {};

/**
 * NestJS `LoggerService` impl that emits one JSON object per line.
 * Replaces the default text formatter so logs are ingestable by any
 * structured-log pipeline (Loki, Datadog, CloudWatch Insights) without
 * a parsing layer.
 *
 * Wire via `app.useLogger(new StructuredLogger())` in `main.ts`.
 *
 * ## Calling convention
 *
 * Two forms are accepted on every level method (`log` / `debug` / `warn`
 * / `error`):
 *
 * ```ts
 * // 1) Legacy text form — kept for compatibility with the existing
 * //    Logger usage scattered across the codebase. Pre-formatted string
 * //    becomes `msg`; the rendered output loses field-level structure.
 * this.logger.debug(`MeterValues from ${stationId}: ${count} readings`);
 *
 * // 2) Structured form — preferred for new code. The first arg is a
 * //    plain object whose keys are emitted as top-level fields on the
 * //    JSON line; the second arg is the human-readable message.
 * this.logger.debug({ stationId, count }, 'MeterValues received');
 * ```
 *
 * Pick form 2 whenever you'd otherwise interpolate variables into a
 * template — it makes log-search by field (e.g. `stationId="k6-1"`)
 * trivial without parsing.
 */
export class StructuredLogger implements LoggerService {
  private readonly enabledLevels: Set<LogLevel>;

  constructor(enabledLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose']) {
    this.enabledLevels = new Set(enabledLevels);
  }

  log(messageOrFields: unknown, ...rest: unknown[]): void {
    this.emit('info', ...this.normalize(messageOrFields, rest));
  }

  error(messageOrFields: unknown, ...rest: unknown[]): void {
    // NestJS's legacy signature: `error(message, stack?, context?)`. When
    // two string args follow a string message, the second is usually a
    // stack trace. The structured form `error({fields}, msg)` falls
    // through `normalize` and ignores the stack-arg ambiguity.
    if (typeof messageOrFields === 'string' && typeof rest[0] === 'string' && rest.length >= 1) {
      const stack = rest.length >= 2 ? rest[0] : undefined;
      const ctx = rest.length >= 2 ? (rest[1] as string) : (rest[0] as string);
      this.emit('error', messageOrFields, ctx, stack ? { stack } : undefined);
      return;
    }
    this.emit('error', ...this.normalize(messageOrFields, rest));
  }

  warn(messageOrFields: unknown, ...rest: unknown[]): void {
    this.emit('warn', ...this.normalize(messageOrFields, rest));
  }

  debug(messageOrFields: unknown, ...rest: unknown[]): void {
    if (!this.enabledLevels.has('debug')) return;
    this.emit('debug', ...this.normalize(messageOrFields, rest));
  }

  verbose(messageOrFields: unknown, ...rest: unknown[]): void {
    if (!this.enabledLevels.has('verbose')) return;
    this.emit('trace', ...this.normalize(messageOrFields, rest));
  }

  /**
   * Resolve overloaded args into `(message, context, extra)`.
   *
   * Accepts both the legacy `(message, context?)` form and the
   * structured `({...fields}, message, context?)` form. When the first
   * arg is a plain object (not an Error / Array), its keys are emitted
   * as top-level fields on the JSON line and the second arg becomes the
   * message.
   */
  private normalize(
    first: unknown,
    rest: unknown[],
  ): [unknown, string | undefined, Record<string, unknown> | undefined] {
    if (
      first !== null &&
      typeof first === 'object' &&
      !Array.isArray(first) &&
      !(first instanceof Error)
    ) {
      const message = typeof rest[0] === 'string' ? rest[0] : '';
      const ctx = typeof rest[1] === 'string' ? rest[1] : undefined;
      return [message, ctx, first as Record<string, unknown>];
    }
    const ctx = typeof rest[0] === 'string' ? rest[0] : undefined;
    return [first, ctx, undefined];
  }

  setLogLevels(levels: LogLevel[]): void {
    this.enabledLevels.clear();
    for (const l of levels) this.enabledLevels.add(l);
  }

  private emit(
    level: 'info' | 'warn' | 'error' | 'debug' | 'trace',
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    const ctx = getLogContext();
    const line: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
      msg: typeof message === 'string' ? message : JSON.stringify(message),
    };
    if (context) line.context = context;
    if (ctx.correlationId) line.correlationId = ctx.correlationId;
    if (ctx.stationId) line.stationId = ctx.stationId;
    if (ctx.tenantId !== undefined) line.tenantId = ctx.tenantId;
    if (ctx.extra) Object.assign(line, ctx.extra);
    if (extra) Object.assign(line, extra);
    // eslint-disable-next-line no-console
    (level === 'error' ? console.error : console.log)(JSON.stringify(line));
  }
}
