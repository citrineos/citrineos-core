// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/core/wireLog.ts
// WireLogger: the human-facing wire trace. Every finalized Exchange (inbound
// and outbound) is emitted as a one-line summary to stderr and, when NDJSON is
// enabled, as a structured line to stdout for machine capture. Tokens and
// Authorization headers are redacted. child() adds correlation bindings.
// ============================================================================
import type { Exchange, WireLogger } from './types.js';

export interface WireLoggerOptions {
  /** Emit a structured NDJSON line per exchange to stdout. Default off. */
  ndjson?: boolean;
  /** Print a one-line pretty summary per exchange to stderr. Default on. */
  pretty?: boolean;
  /** Correlation bindings mixed into every NDJSON line. */
  bindings?: Record<string, unknown>;
}

const REDACTED = '***';

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = k.toLowerCase() === 'authorization' ? 'Token ***' : v;
  }
  return out;
}

function redactToken(token?: string): string | undefined {
  if (!token) return token;
  return token.length <= 6 ? REDACTED : `${token.slice(0, 3)}${REDACTED}`;
}

class WireLoggerImpl implements WireLogger {
  constructor(private readonly opts: WireLoggerOptions) {}

  record(x: Exchange): void {
    if (this.opts.pretty !== false) {
      this.pretty(x);
    }
    if (this.opts.ndjson) {
      const line = {
        ...this.opts.bindings,
        seq: x.seq,
        id: x.id,
        flowId: x.flowId,
        direction: x.direction,
        module: x.module,
        operation: x.operation,
        request: {
          method: x.request.method,
          url: x.request.url,
          path: x.request.path,
          query: x.request.query,
          headers: redactHeaders(x.request.headers),
          body: x.request.body,
          ocpi: { ...x.request.ocpi, token: redactToken(x.request.ocpi.token) },
        },
        response: {
          httpStatus: x.response.httpStatus,
          headers: x.response.headers,
          ocpiStatusCode: x.response.ocpiStatusCode,
          body: x.response.body,
        },
        validation: x.validation,
        fault: x.fault,
        findings: x.findings,
        timing: x.timing,
      };
      process.stdout.write(`${JSON.stringify(line)}\n`);
    }
  }

  child(bindings: Record<string, unknown>): WireLogger {
    return new WireLoggerImpl({
      ...this.opts,
      bindings: { ...this.opts.bindings, ...bindings },
    });
  }

  private pretty(x: Exchange): void {
    const arrow = x.direction === 'inbound' ? '<--' : '-->';
    const status = x.response.httpStatus || '-';
    const ocpi = x.response.ocpiStatusCode ?? '-';
    const invalid = x.validation.ok === false ? ' INVALID' : '';
    const fault = x.fault ? ` FAULT:${x.fault.kind}` : '';
    const findings = x.findings.length > 0 ? ` findings:${x.findings.length}` : '';
    const rid = x.request.ocpi.requestId ? ` req=${x.request.ocpi.requestId}` : '';
    const dur = x.timing.durationMs != null ? ` ${x.timing.durationMs}ms` : '';

    console.error(
      `[wire] ${arrow} ${x.request.method} ${x.request.path} -> ${status} ocpi=${ocpi}` +
        `${invalid}${fault}${findings}${rid}${dur} seq=${x.seq}`,
    );
  }
}

export function createWireLogger(opts: WireLoggerOptions = {}): WireLogger {
  return new WireLoggerImpl(opts);
}
