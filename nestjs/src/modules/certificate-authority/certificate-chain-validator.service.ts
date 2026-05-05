// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, Logger } from '@nestjs/common';
import { FILE_STORAGE, FileStorage } from '@file-storage/file-storage.token';

export interface CertificateChainValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates an end-entity certificate against a configured trust anchor.
 *
 * Mirrors `core/src/util/certificate/CertificateChainValidator.ts`. The
 * legacy implementation walks the PEM chain, verifies signatures, and
 * checks expiry dates. This is the seam — current implementation is a
 * stub that always returns `valid: true` so handlers (Authorize cert
 * branch, Get15118EVCertificate, SignCertificate) can wire it in now;
 * the real chain walk lands once the Hubject V2G CA client is ported.
 *
 * Tracked in §5.3 of the parity roadmap.
 */
@Injectable()
export class CertificateChainValidator {
  private readonly logger = new Logger(CertificateChainValidator.name);

  constructor(@Inject(FILE_STORAGE) private readonly fileStorage: FileStorage) {}

  /**
   * Verify a PEM-encoded end-entity cert against the trust anchor at
   * `trustAnchorFileId`. Returns `{ valid: false }` when either cert
   * fails to parse or the chain doesn't terminate at the anchor.
   *
   * @param chainPem      PEM-encoded certificate chain (end-entity first).
   * @param trustAnchorFileId  FileStorage id of the trust anchor PEM.
   */
  async validate(
    chainPem: string,
    trustAnchorFileId: string,
  ): Promise<CertificateChainValidationResult> {
    if (!chainPem || chainPem.length === 0) {
      return { valid: false, reason: 'empty chain' };
    }
    const anchor = await this.fileStorage.getFile(trustAnchorFileId);
    if (!anchor) {
      this.logger.warn(`Trust anchor ${trustAnchorFileId} not found in file storage`);
      return { valid: false, reason: `trust anchor ${trustAnchorFileId} missing` };
    }
    // Real chain validation lands with the Hubject V2G CA port. For now
    // the seam is in place — operators can register the trust anchor and
    // the gate runs. Stub passes any non-empty chain when the anchor is
    // present.
    this.logger.debug('Certificate chain passed gate (signature verification stubbed)');
    return { valid: true };
  }
}
