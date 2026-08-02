// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/core/client.ts
// OcpiClient (the Actor): a fetch wrapper that mirrors Citrine's BaseClientApi
// wire rules so Citrine accepts our calls — `Authorization: Token base64(token)`,
// fresh X-Request-ID / X-Correlation-ID on every call, OCPI-* routing headers
// only on functional calls (from=us US/TST, to=CPO US/S44). Every call opens an
// outbound Exchange, consults the FaultEngine (so we can corrupt OUR requests),
// validates Citrine's response with the reused ocpi-base schema (drift =>
// Finding), records + logs, and returns the Exchange. Also drives the
// credentials handshake, sends Commands (hosting the response_url await), and
// pulls Citrine's CPO SENDER endpoints.
// ============================================================================
import { z } from 'zod';
import type { ZodTypeAny } from 'zod';
import type {
  CommandSendResult,
  CpoEndpoint,
  Exchange,
  Finding,
  FaultEngine,
  MockConfig,
  OcpiClient,
  OcpiIdentity,
  OutboundCall,
  RegisterOptions,
  RegistrationState,
  RouteModule,
  Store,
  WireLogger,
} from './types.js';
import {
  CdrSchema,
  CommandResponseSchema,
  CommandType,
  CredentialsResponseSchema,
  LocationDTOSchema,
  ModuleId,
  OcpiEmptyResponseSchema,
  OcpiResponseSchema,
  Role,
  SessionSchema,
  TariffDTOSchema,
  VersionDetailsDTOSchema,
  VersionListResponseDTOSchema,
} from '../ocpi/barrel.js';
import { versionsListUrl } from '../identity.js';
import { buildOutboundAuthHeader } from './auth.js';
import { safeValidate } from './conformance.js';
import { applyOutboundFault } from './faults.js';
import { uuid } from './ids.js';

// Citrine's SENDER list responses, keyed by module. On a pull, Citrine's response
// body IS the payload under test, so it gets the same ocpi-base schemas an
// inbound push is held to.
const PULL_RESPONSE_SCHEMAS: Partial<Record<ModuleId, ZodTypeAny>> = {
  [ModuleId.Locations]: OcpiResponseSchema(z.array(LocationDTOSchema)),
  [ModuleId.Sessions]: OcpiResponseSchema(z.array(SessionSchema)),
  [ModuleId.Cdrs]: OcpiResponseSchema(z.array(CdrSchema)),
  [ModuleId.Tariffs]: OcpiResponseSchema(z.array(TariffDTOSchema)),
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split('?')[0];
  }
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function asData(body: unknown): Record<string, unknown> | undefined {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data?: Record<string, unknown> }).data;
  }
  return undefined;
}

export interface OcpiClientDeps {
  config: MockConfig;
  identity: OcpiIdentity;
  store: Store;
  faults: FaultEngine;
  log: WireLogger;
}

class OcpiClientImpl implements OcpiClient {
  constructor(private readonly deps: OcpiClientDeps) {}

  // ---- the one outbound primitive ----
  async call(spec: OutboundCall): Promise<Exchange> {
    const { config, store, faults, log } = this.deps;
    const ex = store.open({
      direction: 'outbound',
      module: spec.module,
      operation: spec.operation,
    });

    const presentToken = spec.presentToken ?? store.domain.registration.tokenWePresent;
    const requestId = uuid();
    const correlationId = uuid();
    let headers: Record<string, string> = {
      Authorization: buildOutboundAuthHeader(presentToken),
      'X-Request-ID': requestId,
      'X-Correlation-ID': correlationId,
      Accept: 'application/json',
    };
    if (spec.body !== undefined) headers['Content-Type'] = 'application/json';
    if (spec.functional) {
      headers['OCPI-from-country-code'] = config.countryCode;
      headers['OCPI-from-party-id'] = config.partyId;
      headers['OCPI-to-country-code'] = config.cpoCountryCode;
      headers['OCPI-to-party-id'] = config.cpoPartyId;
    }
    let body = spec.body;

    ex.request = {
      method: spec.method,
      url: spec.url,
      path: safePath(spec.url),
      query: {},
      headers: { ...headers },
      rawBody: body !== undefined ? this.stringify(body) : '',
      body,
      ocpi: {
        requestId,
        correlationId,
        token: presentToken,
        from: spec.functional ? { cc: config.countryCode, party: config.partyId } : undefined,
        to: spec.functional ? { cc: config.cpoCountryCode, party: config.cpoPartyId } : undefined,
      },
    };

    // ---- outbound fault injection (corrupt OUR request) ----
    let delayMs = 0;
    let skipSend = false;
    const decision = faults.decide(
      { direction: 'outbound', module: spec.module, method: spec.method, path: ex.request.path },
      ex,
    );
    if (decision) {
      ex.fault = { ruleId: decision.rule.id, kind: decision.action.kind, detail: decision.action };
      const applied = applyOutboundFault(decision.action, { headers, body });
      headers = applied.headers;
      body = applied.body;
      delayMs = applied.delayMs ?? 0;
      skipSend = applied.skipSend ?? false;
      ex.request.headers = { ...headers };
      ex.request.body = body;
      ex.request.rawBody = body !== undefined ? this.stringify(body) : '';
    }

    if (delayMs > 0) await sleep(delayMs);

    if (skipSend) {
      ex.response = { httpStatus: 0, headers: {}, body: undefined };
      this.finalizeTiming(ex);
      store.record(ex);
      log.record(ex);
      return ex;
    }

    // ---- send ----
    try {
      const res = await fetch(spec.url, {
        method: spec.method,
        headers,
        body: body !== undefined ? this.stringify(body) : undefined,
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        parsed = text; // keep the raw non-JSON so validation flags it
      }
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        respHeaders[k] = v;
      });
      const ocpiStatusCode =
        parsed && typeof parsed === 'object' && 'status_code' in parsed
          ? (parsed as { status_code?: number }).status_code
          : undefined;
      ex.response = { httpStatus: res.status, headers: respHeaders, body: parsed, ocpiStatusCode };

      if (spec.responseSchema) {
        const v = safeValidate(spec.responseSchema, parsed);
        ex.validation = { schema: spec.operation, ok: v.ok, issues: v.issues };
        if (!v.ok) {
          this.addFinding(ex, {
            severity: 'error',
            kind: 'body',
            module: spec.module,
            seq: ex.seq,
            detail: `Citrine response to ${spec.operation} failed the ocpi-base schema`,
            issues: v.issues,
          });
        }
      }
      // Suppress the generic warn when the caller EXPECTS this exact status
      // (e.g. the stale-token probe wants a 401) — schema validation above is
      // unaffected.
      if ((res.status < 200 || res.status > 299) && res.status !== spec.expectHttpStatus) {
        this.addFinding(ex, {
          severity: 'warn',
          kind: 'status',
          module: spec.module,
          seq: ex.seq,
          detail: `Citrine returned HTTP ${res.status} for ${spec.operation}`,
        });
      }
    } catch (err) {
      ex.response = { httpStatus: 0, headers: {}, body: { error: String(err) } };
      this.addFinding(ex, {
        severity: 'error',
        kind: 'status',
        module: spec.module,
        seq: ex.seq,
        detail: `Outbound call ${spec.operation} to ${spec.url} failed: ${String(err)}`,
      });
    }

    this.finalizeTiming(ex);
    store.record(ex);
    log.record(ex);
    return ex;
  }

  getVersions(url: string, token?: string): Promise<Exchange> {
    return this.call({
      method: 'GET',
      url,
      module: 'versions',
      operation: 'versions.list',
      functional: false,
      responseSchema: VersionListResponseDTOSchema,
      presentToken: token,
    });
  }

  getVersionDetails(url: string, token?: string): Promise<Exchange> {
    return this.call({
      method: 'GET',
      url,
      module: 'versions',
      operation: 'versions.details',
      functional: false,
      responseSchema: OcpiResponseSchema(VersionDetailsDTOSchema),
      presentToken: token,
    });
  }

  // ---- credentials handshake (mock-initiated is the reliable path) ----
  async register(opts?: RegisterOptions): Promise<RegistrationState> {
    const { config, store } = this.deps;
    const reg = store.domain.registration;
    const mode = opts?.mode ?? 'msp-initiated';
    const citrineVersionsUrl = config.citrineVersionsUrl ?? `${config.citrineOcpiBaseUrl}/versions`;

    if (mode === 'cpo-initiated') {
      // Hand Citrine our TOKEN_A + versions url; Citrine then GETs our versions
      // and POSTs its credentials back to us, and our credentials module
      // completes the handshake inbound.
      const ourTokenA = opts?.tokenA ?? reg.tokenA ?? uuid();
      reg.tokenA = ourTokenA;
      await this.call({
        method: 'POST',
        url: `${config.citrineOcpiBaseUrl}/2.2.1/credentials/register-credentials-token-a`,
        module: 'credentials',
        operation: 'credentials.register-token-a',
        functional: false,
        body: {
          token: ourTokenA,
          url: versionsListUrl(config.publicBaseUrl),
          roles: [this.ourRole()],
        },
        responseSchema: CredentialsResponseSchema,
      });
      return reg;
    }

    // ---- msp-initiated ----
    let tokenA = opts?.tokenA ?? reg.tokenA;
    if (!tokenA) {
      // Mint TOKEN_A via the admin endpoint (no OCPI auth needed).
      const genEx = await this.call({
        method: 'POST',
        url: `${config.citrineOcpiBaseUrl}/2.2.1/credentials/generate-credentials-token-a`,
        module: 'credentials',
        operation: 'credentials.generate-token-a',
        functional: false,
        body: {
          url: citrineVersionsUrl,
          role: {
            role: Role.CPO,
            party_id: config.cpoPartyId,
            country_code: config.cpoCountryCode,
            business_details: { name: 'CitrineOSElectricVehicleSolutions' },
          },
          mspCountryCode: config.countryCode,
          mspPartyId: config.partyId,
        },
        responseSchema: CredentialsResponseSchema,
      });
      const data = asData(genEx.response.body);
      if (!data?.token) {
        throw new Error('generate-credentials-token-a did not return a token');
      }
      tokenA = String(data.token);
      reg.cpoVersionsUrl = typeof data.url === 'string' ? data.url : citrineVersionsUrl;
    } else {
      reg.cpoVersionsUrl = citrineVersionsUrl;
    }
    reg.tokenA = tokenA;

    // GET versions -> pick 2.2.1
    const versionsEx = await this.getVersions(reg.cpoVersionsUrl, tokenA);
    const versions = asData(versionsEx.response.body) as unknown as
      | Array<{ version: string; url: string }>
      | undefined;
    const v221 = Array.isArray(versions) ? versions.find((v) => v.version === '2.2.1') : undefined;
    if (!v221) throw new Error('CPO does not advertise OCPI version 2.2.1');

    // GET version details -> endpoints + credentials endpoint
    const detailsEx = await this.getVersionDetails(v221.url, tokenA);
    const details = asData(detailsEx.response.body);
    const endpoints = details?.endpoints as CpoEndpoint[] | undefined;
    if (!endpoints || endpoints.length === 0) {
      throw new Error('CPO version details returned no endpoints');
    }
    reg.cpoEndpoints = endpoints;
    const credsEndpoint = endpoints.find((e) => e.identifier === ModuleId.Credentials);
    if (!credsEndpoint) throw new Error('CPO version details missing a credentials endpoint');
    reg.cpoCredentialsUrl = credsEndpoint.url;

    // POST our credentials presenting TOKEN_A; ourToken becomes tokenWeAccept.
    const ourToken = uuid();
    const postEx = await this.call({
      method: 'POST',
      url: credsEndpoint.url,
      module: 'credentials',
      operation: 'credentials.post',
      functional: false,
      body: {
        token: ourToken,
        url: versionsListUrl(config.publicBaseUrl),
        roles: [this.ourRole()],
      },
      responseSchema: CredentialsResponseSchema,
      presentToken: tokenA,
    });
    const respData = asData(postEx.response.body);
    if (!respData?.token) throw new Error('CPO credentials response missing token');

    reg.tokenWeAccept = ourToken;
    reg.tokenWePresent = String(respData.token);
    reg.tokenA = undefined;
    reg.status = 'registered';
    reg.registeredAt = new Date().toISOString();
    return reg;
  }

  async reregister(): Promise<RegistrationState> {
    const { config, store } = this.deps;
    const reg = store.domain.registration;
    const versionsUrl =
      reg.cpoVersionsUrl ?? config.citrineVersionsUrl ?? `${config.citrineOcpiBaseUrl}/versions`;
    const versionsEx = await this.getVersions(versionsUrl);
    const versions = asData(versionsEx.response.body) as unknown as
      | Array<{ version: string; url: string }>
      | undefined;
    const v221 = Array.isArray(versions) ? versions.find((v) => v.version === '2.2.1') : undefined;
    if (v221) {
      const detailsEx = await this.getVersionDetails(v221.url);
      const details = asData(detailsEx.response.body);
      const endpoints = details?.endpoints as CpoEndpoint[] | undefined;
      if (endpoints && endpoints.length > 0) {
        reg.cpoEndpoints = endpoints;
        const creds = endpoints.find((e) => e.identifier === ModuleId.Credentials);
        if (creds) reg.cpoCredentialsUrl = creds.url;
      }
    }
    return reg;
  }

  // Rotate our credentials AT the CPO (OCPI credentials PUT). Distinct from
  // reregister(), which only re-discovers the endpoint catalog: this really
  // mints a fresh token for Citrine to present to US, PUTs it, adopts the new
  // token Citrine mints for us to present to IT, and then verifies the old
  // outbound token died. Token state is swapped ONLY after a schema-valid
  // response so a rejected/failed PUT leaves the working registration intact.
  async rotateCredentials(): Promise<RegistrationState> {
    const { config, store } = this.deps;
    const reg = store.domain.registration;
    if (reg.status !== 'registered' || !reg.cpoCredentialsUrl) {
      throw new Error(
        'rotateCredentials requires a registered state with a known CPO credentials URL',
      );
    }

    const oldPresentToken = reg.tokenWePresent;
    const newOurToken = uuid();
    const putEx = await this.call({
      method: 'PUT',
      url: reg.cpoCredentialsUrl,
      module: 'credentials',
      operation: 'credentials.put',
      functional: false,
      body: {
        token: newOurToken,
        url: versionsListUrl(config.publicBaseUrl),
        roles: [this.ourRole()],
      },
      responseSchema: CredentialsResponseSchema,
    });
    const data = asData(putEx.response.body);
    const okStatus = putEx.response.httpStatus >= 200 && putEx.response.httpStatus <= 299;
    if (!okStatus || !putEx.validation.ok || !data?.token) {
      throw new Error(
        `credentials PUT did not return a valid credentials object (HTTP ${putEx.response.httpStatus})`,
      );
    }
    if (String(data.token) === oldPresentToken) {
      this.addFinding(putEx, {
        severity: 'error',
        kind: 'body',
        module: 'credentials',
        seq: putEx.seq,
        detail:
          'CPO did not rotate its server token on credentials PUT — spec expects a fresh token per handshake',
      });
    }
    // Swap only now: the PUT is confirmed accepted + schema-valid.
    reg.tokenWePresent = String(data.token);
    reg.tokenWeAccept = newOurToken;
    reg.registeredAt = new Date().toISOString();

    // Stale-token probe: the OLD outbound token must now be rejected. 401 is
    // the passing outcome, so expectHttpStatus keeps the trace warn-free.
    const probeEx = await this.call({
      method: 'GET',
      url: reg.cpoCredentialsUrl,
      module: 'credentials',
      operation: 'credentials.stale-token-probe',
      functional: false,
      presentToken: oldPresentToken,
      expectHttpStatus: 401,
    });
    if (probeEx.response.httpStatus >= 200 && probeEx.response.httpStatus <= 299) {
      this.addFinding(probeEx, {
        severity: 'error',
        kind: 'auth',
        module: 'credentials',
        seq: probeEx.seq,
        detail: 'old token still accepted after credentials rotation',
      });
    }
    return reg;
  }

  async unregister(): Promise<void> {
    const { store } = this.deps;
    const reg = store.domain.registration;
    if (reg.cpoCredentialsUrl) {
      await this.call({
        method: 'DELETE',
        url: reg.cpoCredentialsUrl,
        module: 'credentials',
        operation: 'credentials.delete',
        functional: false,
        responseSchema: OcpiEmptyResponseSchema,
      });
    }
    reg.status = 'unregistered';
    reg.tokenWePresent = '';
    reg.tokenA = undefined;
    reg.cpoEndpoints = [];
    reg.cpoCredentialsUrl = undefined;
    reg.registeredAt = undefined;
  }

  // ---- commands: send to Citrine, host the async response_url ----
  async sendCommand(type: CommandType, payload: unknown): Promise<CommandSendResult> {
    const { config, store } = this.deps;
    const commandId = uuid();
    const responseUrl = `${config.publicBaseUrl}/2.2.1/emsp/commands/${type}/${commandId}`;
    store.domain.commands.set(commandId, {
      commandId,
      type,
      responseUrl,
      sentAt: new Date().toISOString(),
    });
    const body = {
      ...(payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}),
      response_url: responseUrl,
    };
    const ex = await this.call({
      method: 'POST',
      url: `${config.citrineOcpiBaseUrl}/2.2.1/commands/${type}`,
      module: ModuleId.Commands,
      operation: `command.${type}`,
      functional: true,
      body,
      responseSchema: OcpiResponseSchema(CommandResponseSchema),
    });
    const sync = asData(ex.response.body) ?? ex.response.body;
    const responsePath = safePath(responseUrl);
    return {
      sync,
      responseUrl,
      awaitResult: (timeoutMs = 30_000) =>
        store.waitForReceived(
          { direction: 'inbound', pathMatches: escapeRegex(responsePath) },
          timeoutMs,
        ),
    };
  }

  pull(module: ModuleId, params?: Record<string, string>): Promise<Exchange> {
    const { config } = this.deps;
    let url = `${config.citrineOcpiBaseUrl}/2.2.1/${module}`;
    if (params && Object.keys(params).length > 0) {
      url += `?${new URLSearchParams(params).toString()}`;
    }
    return this.call({
      method: 'GET',
      url,
      module: module as RouteModule,
      operation: `pull.${module}`,
      functional: true,
      // Citrine is the SENDER here, so its response body is the payload under
      // test: validate the returned list against ocpi-base's own schemas, the
      // same way an inbound push is validated. Without this the pull is a blind
      // fetch and any drift in what Citrine serves goes unnoticed.
      responseSchema: PULL_RESPONSE_SCHEMAS[module],
    });
  }

  // ---- helpers ----
  private ourRole(): Record<string, unknown> {
    const { config, identity } = this.deps;
    return {
      role: Role.EMSP,
      party_id: config.partyId,
      country_code: config.countryCode,
      business_details: identity.business_details,
    };
  }

  private stringify(body: unknown): string {
    return typeof body === 'string' ? body : JSON.stringify(body);
  }

  private finalizeTiming(ex: Exchange): void {
    const respondedAt = new Date().toISOString();
    ex.timing.respondedAt = respondedAt;
    ex.timing.durationMs = Date.parse(respondedAt) - Date.parse(ex.timing.receivedAt);
  }

  private addFinding(ex: Exchange, finding: Finding): void {
    ex.findings.push(finding);
    this.deps.store.addFinding(finding);
  }
}

export function createOcpiClient(deps: OcpiClientDeps): OcpiClient {
  return new OcpiClientImpl(deps);
}
