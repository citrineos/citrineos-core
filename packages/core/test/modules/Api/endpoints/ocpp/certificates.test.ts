// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TENANT_ID, IMessageConfirmation } from '@citrineos/base';
import { EventGroup, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { DeleteCertificateEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/certificates/DeleteCertificateEndpoint.js';
import { InstallCertificateEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/certificates/InstallCertificateEndpoint.js';
import { aInstallCertificateRequest } from '../../../Certificates/providers/InstallCertificateRequestProvider';
import { aDeleteCertificateRequest } from '../../../Certificates/providers/DeleteCertificateRequestProvider';
import { MOCK_CHARGING_STATION_ID } from '../../../Certificates/providers/ChargingStation';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

const mockInstallCertificateHelperService = {
  prepareToInstallCertificate: vi.fn(),
  prepareToDeleteCertificate: vi.fn(),
};

const mockSendCall = vi.fn();
const mockOcppSender = { sendCall: mockSendCall };

describe('Certificates message endpoints', () => {
  const { container } = createTestContainer();
  const mockInstallCertificateRequest = aInstallCertificateRequest();
  const mockDeleteCertificateRequest = aDeleteCertificateRequest();

  let installCertificate: InstallCertificateEndpoint;
  let deleteCertificate: DeleteCertificateEndpoint;

  beforeEach(() => {
    vi.clearAllMocks();

    installCertificate = getTestInstance(container, InstallCertificateEndpoint, {
      ocppSender: mockOcppSender,
      installCertificateHelperService: mockInstallCertificateHelperService,
    });
    deleteCertificate = getTestInstance(container, DeleteCertificateEndpoint, {
      ocppSender: mockOcppSender,
      installCertificateHelperService: mockInstallCertificateHelperService,
    });
  });

  describe('installCertificate', () => {
    it('should call prepareToInstallCertificate and sendCall for single identifier', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      mockInstallCertificateHelperService.prepareToInstallCertificate.mockResolvedValue(undefined);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      const tenantId = 1;

      await installCertificate.handle(
        [MOCK_CHARGING_STATION_ID],
        mockInstallCertificateRequest,
        undefined,
        tenantId,
        OCPPVersion.OCPP2_0_1,
      );

      expect(mockInstallCertificateHelperService.prepareToInstallCertificate).toHaveBeenCalledTimes(
        1,
      );
      expect(mockInstallCertificateHelperService.prepareToInstallCertificate).toHaveBeenCalledWith(
        tenantId,
        MOCK_CHARGING_STATION_ID,
        mockInstallCertificateRequest.certificate,
        mockInstallCertificateRequest.certificateType,
      );

      expect(mockSendCall).toHaveBeenCalledTimes(1);
      expect(mockSendCall).toHaveBeenCalledWith({
        ocppConnectionName: MOCK_CHARGING_STATION_ID,
        tenantId,
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.InstallCertificate,
        eventGroup: EventGroup.Certificates,
        payload: mockInstallCertificateRequest,
        callbackUrl: undefined,
      });
    });

    it('should call prepareToInstallCertificate and sendCall for each identifier in array', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      mockInstallCertificateHelperService.prepareToInstallCertificate.mockResolvedValue(undefined);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      const identifiers = [MOCK_CHARGING_STATION_ID, 'cp002', 'cp003'];
      const tenantId = 1;
      const callbackUrl = 'http://callback.example.com';

      const results = await installCertificate.handle(
        identifiers,
        mockInstallCertificateRequest,
        callbackUrl,
        tenantId,
        OCPPVersion.OCPP2_0_1,
      );

      expect(mockInstallCertificateHelperService.prepareToInstallCertificate).toHaveBeenCalledTimes(
        3,
      );
      for (const [index, ocppConnectionName] of identifiers.entries()) {
        expect(
          mockInstallCertificateHelperService.prepareToInstallCertificate,
        ).toHaveBeenNthCalledWith(
          index + 1,
          tenantId,
          ocppConnectionName,
          mockInstallCertificateRequest.certificate,
          mockInstallCertificateRequest.certificateType,
        );
        expect(mockSendCall).toHaveBeenNthCalledWith(index + 1, {
          ocppConnectionName,
          tenantId,
          protocol: OCPPVersion.OCPP2_0_1,
          action: OCPP_CallAction.InstallCertificate,
          eventGroup: EventGroup.Certificates,
          payload: mockInstallCertificateRequest,
          callbackUrl,
        });
      }

      expect(mockSendCall).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
      expect(results[0]).toBe(mockMessageConfirmation);
    });

    it('should use DEFAULT_TENANT_ID when tenantId is not provided', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      mockInstallCertificateHelperService.prepareToInstallCertificate.mockResolvedValue(undefined);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      await installCertificate.handle(
        [MOCK_CHARGING_STATION_ID],
        mockInstallCertificateRequest,
        undefined,
        undefined,
        OCPPVersion.OCPP2_0_1,
      );

      expect(mockInstallCertificateHelperService.prepareToInstallCertificate).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_CHARGING_STATION_ID,
        mockInstallCertificateRequest.certificate,
        mockInstallCertificateRequest.certificateType,
      );
      expect(mockSendCall).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: DEFAULT_TENANT_ID }),
      );
    });

    it('should call prepareToInstallCertificate before sendCall', async () => {
      const callOrder: string[] = [];
      mockInstallCertificateHelperService.prepareToInstallCertificate.mockImplementation(
        async () => {
          callOrder.push('prepare');
        },
      );
      mockSendCall.mockImplementation(async () => {
        callOrder.push('sendCall');
        return { success: true } as IMessageConfirmation;
      });

      await installCertificate.handle(
        [MOCK_CHARGING_STATION_ID],
        mockInstallCertificateRequest,
        undefined,
        1,
        OCPPVersion.OCPP2_0_1,
      );

      expect(callOrder).toEqual(['prepare', 'sendCall']);
    });
  });

  describe('deleteCertificate', () => {
    it('delegates to prepareToDeleteCertificate then sends, for a single identifier', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      mockSendCall.mockResolvedValue(mockMessageConfirmation);
      const tenantId = 1;

      await deleteCertificate.handle(
        [MOCK_CHARGING_STATION_ID],
        mockDeleteCertificateRequest,
        undefined,
        tenantId,
        OCPPVersion.OCPP2_0_1,
      );

      expect(mockInstallCertificateHelperService.prepareToDeleteCertificate).toHaveBeenCalledWith(
        tenantId,
        MOCK_CHARGING_STATION_ID,
        mockDeleteCertificateRequest.certificateHashData,
      );
      expect(mockSendCall).toHaveBeenCalledWith({
        ocppConnectionName: MOCK_CHARGING_STATION_ID,
        tenantId,
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.DeleteCertificate,
        eventGroup: EventGroup.Certificates,
        payload: mockDeleteCertificateRequest,
        callbackUrl: undefined,
      });
    });

    it('prepares before sending', async () => {
      const callOrder: string[] = [];
      mockInstallCertificateHelperService.prepareToDeleteCertificate.mockImplementation(
        async () => {
          callOrder.push('prepare');
        },
      );
      mockSendCall.mockImplementation(async () => {
        callOrder.push('send');
        return { success: true } as IMessageConfirmation;
      });

      await deleteCertificate.handle(
        [MOCK_CHARGING_STATION_ID],
        mockDeleteCertificateRequest,
        undefined,
        1,
        OCPPVersion.OCPP2_0_1,
      );

      expect(callOrder).toEqual(['prepare', 'send']);
    });

    it('prepares and sends once per identifier', async () => {
      mockSendCall.mockResolvedValue({ success: true } as IMessageConfirmation);
      const identifiers = [MOCK_CHARGING_STATION_ID, 'cp002', 'cp003'];

      const results = await deleteCertificate.handle(
        identifiers,
        mockDeleteCertificateRequest,
        undefined,
        1,
        OCPPVersion.OCPP2_0_1,
      );

      expect(mockInstallCertificateHelperService.prepareToDeleteCertificate).toHaveBeenCalledTimes(
        3,
      );
      expect(mockSendCall).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
    });

    it('passes the callbackUrl through for each identifier', async () => {
      mockSendCall.mockResolvedValue({ success: true } as IMessageConfirmation);
      const tenantId = 1;
      const callbackUrl = 'http://callback.example.com';

      await deleteCertificate.handle(
        [MOCK_CHARGING_STATION_ID, 'cp002'],
        mockDeleteCertificateRequest,
        callbackUrl,
        tenantId,
        OCPPVersion.OCPP2_0_1,
      );

      expect(mockSendCall).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ ocppConnectionName: MOCK_CHARGING_STATION_ID, callbackUrl }),
      );
      expect(mockSendCall).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ ocppConnectionName: 'cp002', callbackUrl }),
      );
    });

    it('should use DEFAULT_TENANT_ID when tenantId is not provided', async () => {
      mockSendCall.mockResolvedValue({ success: true } as IMessageConfirmation);

      await deleteCertificate.handle(
        [MOCK_CHARGING_STATION_ID],
        mockDeleteCertificateRequest,
        undefined,
        undefined,
        OCPPVersion.OCPP2_0_1,
      );

      expect(mockInstallCertificateHelperService.prepareToDeleteCertificate).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_CHARGING_STATION_ID,
        mockDeleteCertificateRequest.certificateHashData,
      );
    });
  });
});
