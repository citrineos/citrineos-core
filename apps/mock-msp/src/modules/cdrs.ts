// ============================================================================
// FILE: apps/mock-msp/src/modules/cdrs.ts
// CDRs RECEIVER module: the eMSP endpoint Citrine (CPO) POSTs a completed
// Charge Detail Record to.
//
//   POST /ocpi/2.2.1/emsp/cdrs         -> store the new CDR, 200 empty envelope
//                                         + Location header -> the stored CDR url
//   GET  /ocpi/2.2.1/emsp/cdrs/:id     -> return the stored CDR (/_mock only)
//
// Per OCPI 2.2.1 the CPO POSTs a full Cdr to the BARE base (no path params) and
// the receiver answers HTTP 200 with a `Location` header pointing at the GET url
// of the stored CDR. requestSchema is the reused @citrineos/ocpi-base CdrSchema
// so a schema-invalid inbound body is recorded as a Finding (drift detection);
// responseSchema is OcpiEmptyResponseSchema (the LIVE broadcaster path parses an
// empty envelope — `data` MUST be omitted, so we reply ctx.empty()).
//
// Recon note: Citrine's CdrsClientApi ignores the Location header and never
// issues the follow-up GET, so the GET reader exists purely for /_mock
// completeness; we still emit a spec-correct Location on POST.
// ============================================================================
import type { ModuleDef, MockContext, OcpiReply } from '../core/types.js';
import {
  ModuleId,
  OcpiEmptyResponseSchema,
  OcpiResponseSchema,
  OcpiResponseStatusCode,
  CdrSchema,
} from '../ocpi/barrel.js';

const CDRS_MOUNT = '/ocpi/2.2.1/emsp/cdrs';

// Composed locally from reused barrel schemas: the GET reader wraps a full Cdr
// in the standard OCPI response envelope (no ready-made barrel wrapper exists).
const CdrGetResponseSchema = OcpiResponseSchema(CdrSchema);

// Extract the CDR `id` (Cdr.id, string<=39) from a parsed body, best-effort.
// A malformed/absent body has already been recorded as a Finding by the
// dispatcher's conformance check against CdrSchema — we just store what we can.
function cdrIdOf(body: unknown): string {
  if (body && typeof body === 'object' && 'id' in body) {
    const id = (body as { id?: unknown }).id;
    if (typeof id === 'string') return id;
  }
  return '';
}

// POST '' (bare base): upsert the Cdr keyed by its id, reply empty envelope with
// a Location header pointing at the stored CDR's GET url.
function handlePostCdr(ctx: MockContext): OcpiReply {
  const body = ctx.req?.body;
  const id = cdrIdOf(body);
  if (id) {
    ctx.store.domain.cdrs.set(id, body);
  }
  const reply = ctx.empty();
  reply.headers = {
    Location: `${ctx.config.publicBaseUrl}/2.2.1/emsp/cdrs/${id}`,
  };
  return reply;
}

// GET '/:id': return the stored CDR (for /_mock inspection; Citrine never calls).
function handleGetCdr(ctx: MockContext): OcpiReply {
  const id = ctx.req?.params.id ?? '';
  const cdr = ctx.store.domain.cdrs.get(id);
  if (cdr === undefined) {
    return ctx.error(OcpiResponseStatusCode.ClientGenericError, `Unknown CDR '${id}'`, 404);
  }
  return ctx.ok(cdr);
}

export const cdrsModule: ModuleDef = {
  id: ModuleId.Cdrs,
  mount: CDRS_MOUNT,
  routes: [
    {
      module: ModuleId.Cdrs,
      method: 'POST',
      path: '',
      operation: 'cdrs.post',
      auth: 'functional',
      requireRoutingHeaders: true,
      requestSchema: CdrSchema,
      responseSchema: OcpiEmptyResponseSchema,
      handle: handlePostCdr,
    },
    {
      module: ModuleId.Cdrs,
      method: 'GET',
      path: '/:id',
      operation: 'cdrs.get',
      auth: 'functional',
      requireRoutingHeaders: true,
      responseSchema: CdrGetResponseSchema,
      handle: handleGetCdr,
    },
  ],
};
