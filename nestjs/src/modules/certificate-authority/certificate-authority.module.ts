// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Global, Module } from '@nestjs/common';
import { AcmeChargingStationCAService } from '@certificate-authority/acme-charging-station-ca.service';
import { CertificateChainValidator } from '@certificate-authority/certificate-chain-validator.service';
import { CertificateSignedDispatcher } from '@certificate-authority/certificate-signed-dispatcher.service';
import { HubjectV2GCAService } from '@certificate-authority/hubject-v2g-ca.service';

/**
 * Certificate Authority subsystem.
 *
 * Mirrors `core/src/util/certificate/` from the legacy server:
 *   - Hubject V2G CA (ISO 15118 contract certs)
 *   - ACME CA (charging-station TLS certs)
 *   - chain validator (used by Authorize / SignedMeterValue /
 *     Get15118EVCertificate)
 *   - CertificateSigned dispatcher (delivers a freshly-signed cert back
 *     to the charger via the CSMS-initiated CertificateSigned CALL)
 *
 * `@Global()` so handlers can inject these without each domain module
 * importing this one. Currently real-but-not-fully-implemented: Hubject
 * makes real HTTP calls when configured, ACME does the directory/nonce
 * boilerplate but the JWS flow is pending.
 */
@Global()
@Module({
  providers: [
    CertificateChainValidator,
    HubjectV2GCAService,
    AcmeChargingStationCAService,
    CertificateSignedDispatcher,
  ],
  exports: [
    CertificateChainValidator,
    HubjectV2GCAService,
    AcmeChargingStationCAService,
    CertificateSignedDispatcher,
  ],
})
/**
 * NestJS DI module wiring the Certificate Authority surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class CertificateAuthorityModule {}
