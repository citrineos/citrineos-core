// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { Socket } from 'net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientCertificateFilter } from '@/transport/index.js';
import { aRequest, aTlsSocket } from '../../../providers/incoming-message-provider.js';
import { anAuthenticationOptions } from '../../../providers/authentication-options-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

describe('ClientCertificateFilter', () => {
  const { container } = createTestContainer();
  const chargingStationRepository = { readChargingStationByOcppConnectionName: vi.fn() };
  const filter = getTestInstance(container, ClientCertificateFilter, { chargingStationRepository });
  const securityProfile3 = anAuthenticationOptions({ securityProfile: 3 });

  afterEach(() => {
    chargingStationRepository.readChargingStationByOcppConnectionName.mockReset();
  });

  describe.each([0, 1, 2])('given %i security profile', (securityProfile) => {
    it('should do nothing', async () => {
      await filter.authenticate(
        DEFAULT_TENANT_ID,
        'CS-A',
        aRequest({ socket: aTlsSocket('CS-B') }),
        anAuthenticationOptions({ securityProfile }),
      );

      expect(
        chargingStationRepository.readChargingStationByOcppConnectionName,
      ).not.toHaveBeenCalled();
    });
  });

  describe('given security profile 3', () => {
    it('should reject when the socket has no client certificate', async () => {
      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          'CS-A',
          aRequest({ socket: {} as Socket }),
          securityProfile3,
        ),
      ).rejects.toThrow('Client certificate missing or not authorised for CS-A');
      expect(
        chargingStationRepository.readChargingStationByOcppConnectionName,
      ).not.toHaveBeenCalled();
    });

    it('should reject when the client certificate was not verified against the CA', async () => {
      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          'CS-A',
          aRequest({ socket: aTlsSocket('CS-A', false) }),
          securityProfile3,
        ),
      ).rejects.toThrow('Client certificate missing or not authorised for CS-A');
      expect(
        chargingStationRepository.readChargingStationByOcppConnectionName,
      ).not.toHaveBeenCalled();
    });

    it('should reject when the client certificate is empty', async () => {
      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          'CS-A',
          aRequest({ socket: aTlsSocket() }),
          securityProfile3,
        ),
      ).rejects.toThrow('Client certificate missing or not authorised for CS-A');
      expect(
        chargingStationRepository.readChargingStationByOcppConnectionName,
      ).not.toHaveBeenCalled();
    });

    it('should reject when the CN is not the identity and there is no station record', async () => {
      givenStation(undefined);

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          'CS-A',
          aRequest({ socket: aTlsSocket('CS-B') }),
          securityProfile3,
        ),
      ).rejects.toThrow('Certificate CN CS-B does not match CS-A');
    });

    it('should reject when the CN is the identity but not the stored serial number', async () => {
      givenStation({ chargePointSerialNumber: 'SN-1' });

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          'CS-A',
          aRequest({ socket: aTlsSocket('CS-A') }),
          securityProfile3,
        ),
      ).rejects.toThrow('Certificate CN CS-A does not match CS-A');
    });

    it('should accept when the CN is the identity and the station has no serial number', async () => {
      givenStation({ chargePointSerialNumber: null });

      await filter.authenticate(
        DEFAULT_TENANT_ID,
        'CS-A',
        aRequest({ socket: aTlsSocket('CS-A') }),
        securityProfile3,
      );

      expect(
        chargingStationRepository.readChargingStationByOcppConnectionName,
      ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, 'CS-A');
    });

    it('should accept when the CN is the identity and there is no station record', async () => {
      givenStation(undefined);

      await filter.authenticate(
        DEFAULT_TENANT_ID,
        'CS-A',
        aRequest({ socket: aTlsSocket('CS-A') }),
        securityProfile3,
      );
    });

    it('should accept when the CN is the stored serial number and the identity differs', async () => {
      givenStation({ chargePointSerialNumber: 'SN-1' });

      await filter.authenticate(
        DEFAULT_TENANT_ID,
        'CS-A',
        aRequest({ socket: aTlsSocket('SN-1') }),
        securityProfile3,
      );
    });
  });

  function givenStation(station: { chargePointSerialNumber?: string | null } | undefined) {
    chargingStationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(station);
  }
});
