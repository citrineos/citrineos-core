// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CERTIFICATE_AUTHORITY_CONFIG } from '@modules/config/config.tokens';
import type { CertificateAuthorityConfig, HubjectConfig } from '@modules/config/config.schema';

/**
 * Hubject V2G CA client. Mirrors `core/src/util/certificate/HubjectV2GCAClient.ts`.
 *
 * Two outbound calls:
 *   - `getCertificateInstallationData` — passes the charger's EXI-encoded
 *     ISO 15118 contract-cert request to Hubject's CCP endpoint and
 *     returns the EXI-encoded response.
 *   - `signCertificateRequest` — signs a PEM CSR for V2G use.
 *
 * Configured via `util.certificateAuthority.v2gCA.hubject.{baseUrl, clientId, clientSecret}`.
 * When the config is missing or stuck on the placeholder credentials,
 * methods throw a clear error so the caller surfaces a structured failure
 * to the charger.
 */
interface CachedToken {
  accessToken: string;
  /** Wall-clock millis after which we must re-issue. */
  expiresAtMs: number;
}

/** Refresh tokens this many seconds before they actually expire. */
const TOKEN_SAFETY_MARGIN_S = 60;

@Injectable()
export class HubjectV2GCAService {
  private readonly logger = new Logger(HubjectV2GCAService.name);
  /**
   * Per-clientId token cache. The Hubject token endpoint enforces a rate
   * limit; without caching every Get15118EVCertificate call would burn
   * one round-trip for auth and one for the action.
   */
  private readonly tokens = new Map<string, CachedToken>();

  constructor(
    @Inject(CERTIFICATE_AUTHORITY_CONFIG)
    private readonly caCfg: CertificateAuthorityConfig | undefined,
  ) {}

  async getCertificateInstallationData(
    exiRequest: string,
    iso15118SchemaVersion: string,
  ): Promise<string> {
    const cfg = this.requireConfig();
    const url = `${cfg.baseUrl.replace(/\/$/, '')}/cpo/v2/iso15118/CertificateInstallation`;
    this.logger.debug(`POST ${url} (schema=${iso15118SchemaVersion})`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.fetchToken(cfg)}`,
      },
      body: JSON.stringify({ exiRequest, iso15118SchemaVersion }),
    });
    if (!res.ok) {
      throw new Error(
        `Hubject CertificateInstallation failed: HTTP ${res.status} ${await res.text()}`,
      );
    }
    const body = (await res.json()) as { exiResponse?: string };
    if (!body.exiResponse) {
      throw new Error('Hubject CertificateInstallation response missing exiResponse');
    }
    return body.exiResponse;
  }

  async signCertificateRequest(csrPem: string): Promise<string> {
    const cfg = this.requireConfig();
    const url = `${cfg.baseUrl.replace(/\/$/, '')}/cpo/v2/ccp/signedContractData`;
    this.logger.debug(`POST ${url} for V2G cert signing`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.fetchToken(cfg)}`,
      },
      body: JSON.stringify({ csr: csrPem }),
    });
    if (!res.ok) {
      throw new Error(`Hubject SignCertificate failed: HTTP ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as { certificate?: string };
    if (!body.certificate) {
      throw new Error('Hubject SignCertificate response missing certificate');
    }
    return body.certificate;
  }

  private requireConfig(): HubjectConfig {
    const v2gCa = this.caCfg?.v2gCA?.hubject;
    if (!v2gCa) {
      throw new Error('Hubject V2G CA is not configured (util.certificateAuthority.v2gCA.hubject)');
    }
    if (v2gCa.clientId === 'YOUR_CLIENT_ID' || v2gCa.clientSecret === 'YOUR_CLIENT_SECRET') {
      throw new Error(
        'Hubject V2G CA credentials are placeholders — set util.certificateAuthority.v2gCA.hubject.clientId/clientSecret',
      );
    }
    return v2gCa;
  }

  /**
   * Fetch a bearer token via OAuth2 client_credentials, caching it for
   * `expires_in - TOKEN_SAFETY_MARGIN_S` seconds. Hubject default TTL is
   * one hour so amortizing avoids hundreds of unnecessary auth calls.
   */
  private async fetchToken(cfg: HubjectConfig): Promise<string> {
    const cached = this.tokens.get(cfg.clientId);
    if (cached && cached.expiresAtMs > Date.now()) {
      return cached.accessToken;
    }

    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
      }).toString(),
    });
    if (!res.ok) {
      throw new Error(`Hubject token endpoint failed: HTTP ${res.status}`);
    }
    const body = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) {
      throw new Error('Hubject token endpoint did not return access_token');
    }

    // Default to a 5-minute TTL if the server omits expires_in.
    const ttlSeconds = Math.max(60, (body.expires_in ?? 300) - TOKEN_SAFETY_MARGIN_S);
    this.tokens.set(cfg.clientId, {
      accessToken: body.access_token,
      expiresAtMs: Date.now() + ttlSeconds * 1000,
    });
    this.logger.debug(`Cached Hubject token for ${ttlSeconds}s`);
    return body.access_token;
  }
}
