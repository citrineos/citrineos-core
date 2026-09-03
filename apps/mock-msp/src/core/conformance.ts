// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// ConformanceChecker: validate what Citrine sends us against the reused
// ocpi-base Zod schema and turn any drift into Findings. Because the mock reuses
// the SAME schema (same catalog zod instance) Citrine parses with, a validation
// failure here is a real Citrine-side contract drift, not schema skew. Never
// throws — always returns Finding[].
// ============================================================================
import type { ZodTypeAny } from 'zod';
import type { Finding, MockContext, RouteModule } from './types.js';
import { HDR } from './routing-headers.js';

export interface ValidationResult {
  ok: boolean;
  issues?: unknown[];
}

/** safeParse a value against a schema, never throwing. */
export function safeValidate(schema: ZodTypeAny, value: unknown): ValidationResult {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true };
  return { ok: false, issues: result.error.issues };
}

const BODY_BEARING = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Inspect the current inbound request on ctx: message-id headers present, and
 * (when a requestSchema is supplied for a body-bearing method) the body parses.
 */
export function check(ctx: MockContext, schema?: ZodTypeAny): Finding[] {
  const findings: Finding[] = [];
  const req = ctx.req;
  if (!req) return findings;
  const seq = ctx.event?.seq ?? 0;
  const module = (ctx.route?.module ?? 'unknown') as RouteModule | 'unknown';

  // ---- message-id header conformance (spec requires these on every call) ----
  if (!req.headers[HDR.requestId]) {
    findings.push({
      severity: 'warn',
      kind: 'header',
      module,
      seq,
      detail: 'Inbound request missing X-Request-ID header',
    });
  }
  if (!req.headers[HDR.correlationId]) {
    findings.push({
      severity: 'warn',
      kind: 'header',
      module,
      seq,
      detail: 'Inbound request missing X-Correlation-ID header',
    });
  }

  // ---- body conformance against the reused ocpi-base schema ----
  if (schema && BODY_BEARING.has(req.method.toUpperCase())) {
    if (req.body === undefined) {
      findings.push({
        severity: 'error',
        kind: 'body',
        module,
        seq,
        detail: 'Inbound request expected a JSON body but none/invalid JSON was received',
      });
    } else {
      const v = safeValidate(schema, req.body);
      if (!v.ok) {
        findings.push({
          severity: 'error',
          kind: 'body',
          module,
          seq,
          detail: 'Inbound request body failed the ocpi-base schema (Citrine-side drift)',
          issues: v.issues,
        });
      }
    }
  }

  return findings;
}
