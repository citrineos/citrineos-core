// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { SystemConfig } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Hubject } from '../../../src/certificate/client/hubject.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryCache } from '../../../src';

describe.skip('Integration Tests (requires real credentials)', () => {
  let systemConfig: SystemConfig;
  let logger: Logger<ILogObj>;
  let cache: MemoryCache;
  let hubject: Hubject;

  describe('Real Hubject API', () => {
    logger = new Logger<ILogObj>();
    cache = new MemoryCache();

    beforeEach(() => {
      // Read from environment variables
      systemConfig = {
        util: {
          certificateAuthority: {
            v2gCA: {
              name: 'hubject',
              hubject: {
                baseUrl: process.env.HUBJECT_BASE_URL,
                tokenUrl: process.env.HUBJECT_TOKEN_URL,
                clientId: process.env.HUBJECT_CLIENT_ID,
                clientSecret: process.env.HUBJECT_CLIENT_SECRET,
              },
            },
          },
        },
      } as SystemConfig;

      if (!systemConfig.util.certificateAuthority.v2gCA.hubject?.clientId) {
        throw new Error('HUBJECT_CLIENT_ID environment variable not set');
      }

      hubject = new Hubject(systemConfig, cache, logger);
    });

    it('should get root certificates from real API', async () => {
      const result = await hubject.getRootCertificates();

      console.log('\n=== ROOT CERTIFICATES ===');
      console.log(`Found ${result.length} certificates`);
      result.forEach((cert, i) => {
        console.log(`\nCertificate ${i + 1}:`);
        console.log(cert.substring(0, 100) + '...');
      });

      expect(result.length).toBeGreaterThan(0);
    }, 30000);

    it('should get CA certificates from real API', async () => {
      const result = await hubject.getCACertificates();

      console.log('\n=== CA CERTIFICATES ===');
      console.log(`Length: ${result.length} characters`);
      console.log(result.substring(0, 200) + '...');

      expect(result.length).toBeGreaterThan(0);
    }, 30000);

    it('should get signed contract data from real API', async () => {
      const xsdMsgDefNamespace = 'urn:iso:15118:2:2013:MsgDef';
      const certificateInstallationReq = process.env.HUBJECT_TEST_CERT_REQ as string;

      if (!process.env.HUBJECT_TEST_CERT_REQ) {
        console.log('HUBJECT_TEST_CERT_REQ not set, skipping');
        return;
      }

      const result = await hubject.getSignedContractData(
        xsdMsgDefNamespace,
        certificateInstallationReq,
      );

      console.log('\n=== SIGNED CONTRACT DATA ===');
      console.log(`Length: ${result.length} characters`);
      console.log(result.substring(0, 200) + '...');

      expect(result.length).toBeGreaterThan(0);
    }, 30000);

    it('should get signed certificate from real API', async () => {
      const csrString = process.env.HUBJECT_TEST_CSR as string;

      if (!process.env.HUBJECT_TEST_CSR) {
        console.log('HUBJECT_TEST_CSR not set, skipping');
        return;
      }

      const result = await hubject.getSignedCertificate(csrString);

      console.log('\n=== SIGNED CERTIFICATE ===');
      console.log(`Length: ${result.length} characters`);
      console.log(result.substring(0, 200) + '...');

      expect(result.length).toBeGreaterThan(0);
    }, 30000);
  });
});
