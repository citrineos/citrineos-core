// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import * as crypto from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { TRANSACTIONS_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { TransactionsModuleConfig } from '@modules/config/config.schema';
import { FILE_STORAGE, FileStorage } from '@file-storage/file-storage.token';
import { MeterValueType } from '@dto/shared/meter-value.dto';
import { SignedMeterValueType } from '@dto/shared/signed-meter-value.dto';
import { ChargingStationSecurityInfoRepository } from '@repositories/charging-station-security-info.repository';

export interface SignedMeterValueValidationResult {
  valid: boolean;
  reason?: string;
}

export interface SignedMeterValueValidationContext {
  tenantId: number;
  stationId: string;
}

/**
 * OCMF frame parsed into the bytes the signer covered and the raw
 * signature bytes — see SAFE eV "OCMF" v1.0:
 *   `OCMF|{payload-json}|{signature-json}`
 *
 *   - signedBytes covers the literal `OCMF|{payload-json}` (no trailing pipe).
 *   - signature is decoded from the SD (signature data) field per SE.
 */
interface OcmfFrame {
  signedBytes: Buffer;
  signature: Buffer;
  /** SA — e.g. "ECDSA-secp256r1-SHA256", "RSASSA-PKCS1-v1_5-SHA256". */
  algorithm: string;
}

/**
 * Validates `signedMeterValue` envelopes on incoming meter samples.
 *
 * Mirrors `core/src/util/security/SignedMeterValuesUtil.ts`.
 *
 * Gate semantics:
 *   1. When `signedMeterValuesConfiguration` is unset, signed envelopes
 *      pass through unvalidated (configuration is the on-switch).
 *   2. When set, the configured `signingMethod` MUST match the envelope's
 *      `signingMethod`.
 *   3. Public key resolution (in priority order):
 *        a. Envelope-supplied `publicKey` (base64 PEM bytes) — must equal
 *           the configured public key on disk.
 *        b. `ChargingStationSecurityInfos.publicKeyFileId` — per-station.
 *        c. Falls back to the configured `publicKeyFileId`.
 *   4. Signature verification: parse the OCMF frame from
 *      `signedMeterData`, verify the SD signature over the canonical
 *      signed bytes (`OCMF|{payload}`) using the configured public key.
 *
 * Returns `{ valid: false, reason }` for the first failure so callers
 * can short-circuit; on success the per-station `publicKeyFileId` is
 * upserted via `readOrCreate` so the next round-trip skips the disk
 * round-trip's check.
 */
@Injectable()
export class SignedMeterValueValidator {
  private readonly logger = new Logger(SignedMeterValueValidator.name);

  constructor(
    @Inject(TRANSACTIONS_MODULE_CONFIG) private readonly cfg: TransactionsModuleConfig,
    @Inject(FILE_STORAGE) private readonly fileStorage: FileStorage,
    private readonly securityInfo: ChargingStationSecurityInfoRepository,
  ) {}

  async validate(
    meterValues: MeterValueType[],
    context: SignedMeterValueValidationContext,
  ): Promise<SignedMeterValueValidationResult> {
    const cfg = this.cfg.signedMeterValuesConfiguration;
    if (!cfg) return { valid: true };

    let configuredPem: string | undefined;
    let stationPublicKeyFileId: string | null | undefined;

    for (const mv of meterValues) {
      for (const sv of mv.sampledValue) {
        if (!sv.signedMeterValue) continue;

        // Lazy-load the configured PEM and the station's recorded file id —
        // only when we encounter a signed sample.
        if (configuredPem === undefined) {
          configuredPem = await this.fileStorage.getFile(cfg.publicKeyFileId);
          if (!configuredPem) {
            return {
              valid: false,
              reason: `Configured publicKeyFileId "${cfg.publicKeyFileId}" not found in FileStorage`,
            };
          }
        }
        if (stationPublicKeyFileId === undefined) {
          const row = await this.securityInfo.findByStation(context.tenantId, context.stationId);
          stationPublicKeyFileId = row?.publicKeyFileId ?? null;
        }

        const result = this.validateOne(
          sv.signedMeterValue,
          cfg.signingMethod,
          configuredPem,
          stationPublicKeyFileId,
          cfg.publicKeyFileId,
        );
        if (!result.valid) return result;
      }
    }

    // Once we've successfully validated, ensure the station's recorded
    // public key id matches the configured one (matches legacy
    // `readOrCreateChargingStationInfo` upsert on first valid sample).
    if (configuredPem !== undefined && stationPublicKeyFileId === null) {
      await this.securityInfo.readOrCreate({
        tenantId: context.tenantId,
        stationId: context.stationId,
        publicKeyFileId: cfg.publicKeyFileId,
      });
    }
    return { valid: true };
  }

  private validateOne(
    envelope: SignedMeterValueType,
    configuredSigningMethod: 'RSASSA-PKCS1-v1_5' | 'ECDSA',
    configuredPem: string,
    stationPublicKeyFileId: string | null,
    configuredPublicKeyFileId: string,
  ): SignedMeterValueValidationResult {
    if (!envelope.signedMeterData || envelope.signedMeterData.length === 0) {
      return { valid: false, reason: 'signedMeterData missing' };
    }
    if (envelope.signingMethod !== configuredSigningMethod) {
      return {
        valid: false,
        reason: `signingMethod mismatch: got "${envelope.signingMethod}", configured "${configuredSigningMethod}"`,
      };
    }
    if (stationPublicKeyFileId && stationPublicKeyFileId !== configuredPublicKeyFileId) {
      return {
        valid: false,
        reason: 'station publicKeyFileId does not match configured publicKeyFileId',
      };
    }
    if (envelope.publicKey && envelope.publicKey.length > 0) {
      const envelopePem = Buffer.from(envelope.publicKey, 'base64').toString();
      if (normalizePem(envelopePem) !== normalizePem(configuredPem)) {
        return {
          valid: false,
          reason: 'envelope publicKey does not match configured publicKey',
        };
      }
    }

    // Decode the OCMF frame. signedMeterData is base64(<utf-8 OCMF text>).
    const frameText = Buffer.from(envelope.signedMeterData, 'base64').toString('utf8');
    const frame = parseOcmfFrame(frameText);
    if (!frame) {
      return { valid: false, reason: 'signedMeterData is not a valid OCMF frame' };
    }

    try {
      const verifier = crypto.createVerify('sha256');
      verifier.update(frame.signedBytes);
      const ok = verifier.verify(configuredPem, frame.signature);
      if (!ok) {
        return { valid: false, reason: 'OCMF signature verification failed' };
      }
    } catch (err) {
      return {
        valid: false,
        reason: `signature verification error: ${(err as Error).message}`,
      };
    }
    return { valid: true };
  }
}

const normalizePem = (pem: string): string =>
  pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');

/**
 * Parse an OCMF frame: `OCMF|{payload}|{signature}`.
 *
 * - Header MUST be the literal `OCMF|`.
 * - The signature object is the JSON after the LAST `|` (allowing the
 *   payload to embed pipes inside JSON strings).
 * - Signed bytes cover everything before that final pipe — i.e.
 *   `OCMF|{payload}`. The trailing pipe + signature are excluded.
 * - SD (signature data) is hex by default; SE="base64" switches to base64.
 */
function parseOcmfFrame(frame: string): OcmfFrame | null {
  if (!frame.startsWith('OCMF|')) return null;
  const lastPipe = frame.lastIndexOf('|');
  if (lastPipe < 'OCMF|'.length) return null;
  const signedString = frame.slice(0, lastPipe);
  const sigJson = frame.slice(lastPipe + 1);
  let sig: { SA?: string; SE?: string; SD?: string };
  try {
    sig = JSON.parse(sigJson);
  } catch {
    return null;
  }
  if (!sig.SD || !sig.SA) return null;
  const encoding: 'hex' | 'base64' = sig.SE === 'base64' ? 'base64' : 'hex';
  return {
    signedBytes: Buffer.from(signedString, 'utf8'),
    signature: Buffer.from(sig.SD, encoding),
    algorithm: sig.SA,
  };
}
