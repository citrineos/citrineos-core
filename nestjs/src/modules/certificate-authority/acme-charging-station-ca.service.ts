// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as acme from 'acme-client';
import { Client } from 'acme-client';
import { CERTIFICATE_AUTHORITY_CONFIG } from '@modules/config/config.tokens';
import type { AcmeConfig, CertificateAuthorityConfig } from '@modules/config/config.schema';
import { FILE_STORAGE, FileStorage } from '@file-storage/file-storage.token';

const PREFERRED_CHAIN = {
  name: 'ISRG Root X1',
  file: 'isrgrootx1',
};

/**
 * ACME-based ChargingStation CA — RFC 8555 client for Let's Encrypt
 * (or any RFC-8555-compliant directory). Mirrors
 * `core/src/util/certificate/client/acme.ts` from the legacy server.
 *
 * The full JWS signing flow (newAccount, newOrder, challenge solving,
 * finalize, cert download) is delegated to the proven `acme-client`
 * library. We only handle:
 *   - Loading the account key from FileStorage.
 *   - Wiring HTTP-01 challenge tokens onto the local FS at the
 *     configured `challengeDirectory` so a static file server (or the
 *     load balancer) can serve them under
 *     `/.well-known/acme-challenge/{token}`.
 *   - Selecting staging vs production via `AcmeConfig.env`.
 *
 * Account key is cached by file path; rotating the key requires a
 * service restart (matches legacy semantics).
 */
@Injectable()
export class AcmeChargingStationCAService {
  private readonly logger = new Logger(AcmeChargingStationCAService.name);
  /** Per-accountKey ACME client cache so we don't re-login each call. */
  private readonly clients = new Map<string, Client>();

  constructor(
    @Inject(CERTIFICATE_AUTHORITY_CONFIG)
    private readonly caCfg: CertificateAuthorityConfig | undefined,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorage,
  ) {}

  /**
   * Issue a fresh PEM cert for the supplied CSR via Let's Encrypt's
   * `auto()` flow. The CSR's SAN identifiers drive challenge creation;
   * we serve the HTTP-01 token under `challengeDirectory/{token}`.
   *
   * Returns the leaf cert + chain in PEM form, joined.
   */
  async signCertificate(csrPem: string): Promise<string> {
    const cfg = this.requireConfig();
    const client = await this.client(cfg);

    const cert = await client.auto({
      csr: csrPem,
      email: cfg.email,
      termsOfServiceAgreed: true,
      preferredChain: PREFERRED_CHAIN.name,
      challengePriority: ['http-01'],
      skipChallengeVerification: true,
      challengeCreateFn: async (authz, challenge, keyAuthorization) => {
        const filePath = path.join(cfg.challengeDirectory, challenge.token);
        if (!fs.existsSync(cfg.challengeDirectory)) {
          fs.mkdirSync(cfg.challengeDirectory, { recursive: true });
        }
        this.logger.debug(
          `ACME HTTP-01 challenge for ${authz.identifier.value}: writing token to ${filePath}`,
        );
        fs.writeFileSync(filePath, keyAuthorization);
      },
      challengeRemoveFn: async (_authz, _challenge, _keyAuthorization) => {
        // Mirror legacy: nuke the whole challenge dir on completion.
        // Per-call this is fine because we only solve one challenge at a
        // time per request.
        fs.rmSync(cfg.challengeDirectory, { recursive: true, force: true });
      },
    });
    if (!cert) {
      throw new Error('ACME signCertificate: client returned no certificate');
    }
    return cert;
  }

  /**
   * Fetch the Let's Encrypt root CA (ISRG Root X1) so callers can build
   * complete chains. Cacheable by the caller — this hits the network.
   */
  async getRootCACertificate(): Promise<string> {
    const res = await fetch(`https://letsencrypt.org/certs/${PREFERRED_CHAIN.file}.pem`);
    if (!res.ok && res.status !== 304) {
      throw new Error(`ACME root CA fetch failed: HTTP ${res.status}`);
    }
    return await res.text();
  }

  private async client(cfg: AcmeConfig): Promise<Client> {
    const cached = this.clients.get(cfg.accountKeyFilePath);
    if (cached) return cached;

    const accountKey = await this.fileStorage.getFile(cfg.accountKeyFilePath);
    if (!accountKey) {
      throw new Error(
        `ACME CA: account key file "${cfg.accountKeyFilePath}" not found in FileStorage`,
      );
    }

    const directoryUrl =
      cfg.env === 'production'
        ? acme.directory.letsencrypt.production
        : acme.directory.letsencrypt.staging;

    const client = new acme.Client({ directoryUrl, accountKey });
    this.clients.set(cfg.accountKeyFilePath, client);
    return client;
  }

  private requireConfig(): AcmeConfig {
    const acmeCfg = this.caCfg?.chargingStationCA?.acme;
    if (!acmeCfg) {
      throw new Error(
        'ACME ChargingStation CA is not configured (util.certificateAuthority.chargingStationCA.acme)',
      );
    }
    if (!acmeCfg.email) {
      throw new Error(
        'ACME CA: util.certificateAuthority.chargingStationCA.acme.email is required',
      );
    }
    if (!acmeCfg.accountKeyFilePath) {
      throw new Error(
        'ACME CA: util.certificateAuthority.chargingStationCA.acme.accountKeyFilePath is empty',
      );
    }
    return acmeCfg;
  }
}
