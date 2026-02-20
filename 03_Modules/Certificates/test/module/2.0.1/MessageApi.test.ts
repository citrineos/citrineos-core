// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DeleteCertificateAttempt } from '@citrineos/data';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CertificatesModule, CertificatesOcpp201Api } from '../../../src';
import {
  DEFAULT_TENANT_ID,
  IMessageConfirmation,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { aInstallCertificateRequest } from '../../providers/InstallCertificateRequestProvider';
import { aDeleteCertificateRequest } from '../../providers/DeleteCertificateRequestProvider';
import { aSystemConfig } from '../../providers/SystemConfig';
import { mockFastifyInstance } from '../../../vitest.setup';
import { MOCK_CHARGING_STATION_ID } from '../../providers/ChargingStation';

const mockSave = vi.fn().mockResolvedValue({ id: 100 });
let createdDeleteCertificateAttemptInstances: any[] = [];

// todo figure out better way to test sequelize models
vi.mock('@citrineos/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@citrineos/data')>();

  class MockDeleteCertificateAttempt {
    stationId?: string;
    hashAlgorithm?: string;
    issuerNameHash?: string;
    issuerKeyHash?: string;
    serialNumber?: string;
    status?: string;
    tenantId?: number;
    save = mockSave;

    constructor() {
      createdDeleteCertificateAttemptInstances.push(this);
    }
  }

  return {
    ...actual,
    DeleteCertificateAttempt: MockDeleteCertificateAttempt,
    UploadExistingCertificateSchema: actual.UploadExistingCertificateSchema,
    RegenerateInstalledCertificateSchema: actual.RegenerateInstalledCertificateSchema,
  };
});

const mockInstallCertificateHelperService = {
  prepareToInstallCertificate: vi.fn(),
};

const mockDeleteCertificateRepository = {
  readOnlyOneByQuery: vi.fn(),
};

const mockSendCall = vi.fn();

describe('CertificatesOcpp201Api', () => {
  let messageApi: CertificatesOcpp201Api;
  let mockCertificatesModule: CertificatesModule;
  const mockInstallCertificateRequest = aInstallCertificateRequest();
  const mockDeleteCertificateRequest = aDeleteCertificateRequest();

  beforeEach(() => {
    vi.clearAllMocks();

    mockCertificatesModule = {
      config: aSystemConfig(),
      installCertificateHelperService: mockInstallCertificateHelperService,
      deleteCertificateAttemptRepository: mockDeleteCertificateRepository,
      sendCall: mockSendCall,
    } as unknown as CertificatesModule;

    messageApi = new CertificatesOcpp201Api(mockCertificatesModule, mockFastifyInstance);
  });

  describe('installCertificate', () => {
    it('should call prepareToInstallCertificate and sendCall for single identifier', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      mockInstallCertificateHelperService.prepareToInstallCertificate.mockResolvedValue(undefined);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      const identifiers = [MOCK_CHARGING_STATION_ID];
      const tenantId = 1;

      await messageApi.installCertificate(
        identifiers,
        mockInstallCertificateRequest,
        undefined,
        tenantId,
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

      expect(mockCertificatesModule.sendCall).toHaveBeenCalledTimes(1);
      expect(mockCertificatesModule.sendCall).toHaveBeenCalledWith(
        MOCK_CHARGING_STATION_ID,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.InstallCertificate,
        mockInstallCertificateRequest,
        undefined,
      );
    });

    it('should call prepareToInstallCertificate and sendCall for each identifier in array', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      mockInstallCertificateHelperService.prepareToInstallCertificate.mockResolvedValue(undefined);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      const identifiers = [MOCK_CHARGING_STATION_ID, 'cp002', 'cp003'];
      const tenantId = 1;
      const callbackUrl = 'http://callback.example.com';

      const results = await messageApi.installCertificate(
        identifiers,
        mockInstallCertificateRequest,
        callbackUrl,
        tenantId,
      );

      expect(mockInstallCertificateHelperService.prepareToInstallCertificate).toHaveBeenCalledTimes(
        3,
      );
      expect(
        mockInstallCertificateHelperService.prepareToInstallCertificate,
      ).toHaveBeenNthCalledWith(
        1,
        tenantId,
        MOCK_CHARGING_STATION_ID,
        mockInstallCertificateRequest.certificate,
        mockInstallCertificateRequest.certificateType,
      );
      expect(
        mockInstallCertificateHelperService.prepareToInstallCertificate,
      ).toHaveBeenNthCalledWith(
        2,
        tenantId,
        'cp002',
        mockInstallCertificateRequest.certificate,
        mockInstallCertificateRequest.certificateType,
      );
      expect(
        mockInstallCertificateHelperService.prepareToInstallCertificate,
      ).toHaveBeenNthCalledWith(
        3,
        tenantId,
        'cp003',
        mockInstallCertificateRequest.certificate,
        mockInstallCertificateRequest.certificateType,
      );

      expect(mockCertificatesModule.sendCall).toHaveBeenCalledTimes(3);
      expect(mockCertificatesModule.sendCall).toHaveBeenNthCalledWith(
        1,
        MOCK_CHARGING_STATION_ID,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.InstallCertificate,
        mockInstallCertificateRequest,
        callbackUrl,
      );
      expect(mockCertificatesModule.sendCall).toHaveBeenNthCalledWith(
        2,
        'cp002',
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.InstallCertificate,
        mockInstallCertificateRequest,
        callbackUrl,
      );
      expect(mockCertificatesModule.sendCall).toHaveBeenNthCalledWith(
        3,
        'cp003',
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.InstallCertificate,
        mockInstallCertificateRequest,
        callbackUrl,
      );

      expect(results).toHaveLength(3);
      expect(results[0]).toBe(mockMessageConfirmation);
    });

    it('should use DEFAULT_TENANT_ID when tenantId is not provided', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      mockInstallCertificateHelperService.prepareToInstallCertificate.mockResolvedValue(undefined);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      await messageApi.installCertificate(
        [MOCK_CHARGING_STATION_ID],
        mockInstallCertificateRequest,
      );

      expect(mockInstallCertificateHelperService.prepareToInstallCertificate).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_CHARGING_STATION_ID,
        mockInstallCertificateRequest.certificate,
        mockInstallCertificateRequest.certificateType,
      );
      expect(mockCertificatesModule.sendCall).toHaveBeenCalledWith(
        MOCK_CHARGING_STATION_ID,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.InstallCertificate,
        mockInstallCertificateRequest,
        undefined,
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

      await messageApi.installCertificate(
        [MOCK_CHARGING_STATION_ID],
        mockInstallCertificateRequest,
        undefined,
        1,
      );

      expect(callOrder).toEqual(['prepare', 'sendCall']);
    });
  });

  describe('deleteCertificate', () => {
    it('should check for existing pending delete attempt and create one if not found', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;

      mockDeleteCertificateRepository.readOnlyOneByQuery.mockResolvedValue(null);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      const identifiers = [MOCK_CHARGING_STATION_ID];
      const tenantId = 1;

      await messageApi.deleteCertificate(
        identifiers,
        mockDeleteCertificateRequest,
        undefined,
        tenantId,
      );

      expect(mockDeleteCertificateRepository.readOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
        where: {
          stationId: MOCK_CHARGING_STATION_ID,
          hashAlgorithm: mockDeleteCertificateRequest.certificateHashData.hashAlgorithm,
          issuerNameHash: mockDeleteCertificateRequest.certificateHashData.issuerNameHash,
          issuerKeyHash: mockDeleteCertificateRequest.certificateHashData.issuerKeyHash,
          serialNumber: mockDeleteCertificateRequest.certificateHashData.serialNumber,
          status: null,
        },
      });

      expect(mockSave).toHaveBeenCalled();
      expect(mockCertificatesModule.sendCall).toHaveBeenCalledWith(
        MOCK_CHARGING_STATION_ID,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.DeleteCertificate,
        mockDeleteCertificateRequest,
        undefined,
      );
    });

    it('should not create delete attempt if existing pending attempt found', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      const mockExistingAttempt = { id: 50 } as DeleteCertificateAttempt;

      mockDeleteCertificateRepository.readOnlyOneByQuery.mockResolvedValue(mockExistingAttempt);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      await messageApi.deleteCertificate(
        [MOCK_CHARGING_STATION_ID],
        mockDeleteCertificateRequest,
        undefined,
        1,
      );

      expect(mockSave).not.toHaveBeenCalled();
      expect(mockCertificatesModule.sendCall).toHaveBeenCalled();
    });

    it('should check and create attempt for each identifier in array', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;

      mockDeleteCertificateRepository.readOnlyOneByQuery.mockResolvedValue(null);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      const identifiers = [MOCK_CHARGING_STATION_ID, 'cp002', 'cp003'];
      const tenantId = 1;

      const results = await messageApi.deleteCertificate(
        identifiers,
        mockDeleteCertificateRequest,
        undefined,
        tenantId,
      );

      expect(mockDeleteCertificateRepository.readOnlyOneByQuery).toHaveBeenCalledTimes(3);
      expect(mockSave).toHaveBeenCalledTimes(3);
      expect(mockCertificatesModule.sendCall).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
    });

    it('should send call for each identifier after creating attempts', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;

      mockDeleteCertificateRepository.readOnlyOneByQuery.mockResolvedValue(null);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      const identifiers = [MOCK_CHARGING_STATION_ID, 'cp002'];
      const tenantId = 1;
      const callbackUrl = 'http://callback.example.com';

      await messageApi.deleteCertificate(
        identifiers,
        mockDeleteCertificateRequest,
        callbackUrl,
        tenantId,
      );

      expect(mockCertificatesModule.sendCall).toHaveBeenNthCalledWith(
        1,
        MOCK_CHARGING_STATION_ID,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.DeleteCertificate,
        mockDeleteCertificateRequest,
        callbackUrl,
      );
      expect(mockCertificatesModule.sendCall).toHaveBeenNthCalledWith(
        2,
        'cp002',
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.DeleteCertificate,
        mockDeleteCertificateRequest,
        callbackUrl,
      );
    });

    it('should use DEFAULT_TENANT_ID when tenantId is not provided', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;
      mockDeleteCertificateRepository.readOnlyOneByQuery.mockResolvedValue({
        id: 50,
      } as DeleteCertificateAttempt);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);

      await messageApi.deleteCertificate([MOCK_CHARGING_STATION_ID], mockDeleteCertificateRequest);

      expect(mockDeleteCertificateRepository.readOnlyOneByQuery).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.any(Object),
      );
      expect(mockCertificatesModule.sendCall).toHaveBeenCalledWith(
        MOCK_CHARGING_STATION_ID,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.DeleteCertificate,
        mockDeleteCertificateRequest,
        undefined,
      );
    });

    it('should create delete attempt with correct values', async () => {
      const mockMessageConfirmation = { success: true } as IMessageConfirmation;

      mockDeleteCertificateRepository.readOnlyOneByQuery.mockResolvedValue(undefined);
      mockSendCall.mockResolvedValue(mockMessageConfirmation);
      createdDeleteCertificateAttemptInstances = [];

      await messageApi.deleteCertificate(
        [MOCK_CHARGING_STATION_ID],
        mockDeleteCertificateRequest,
        undefined,
        1,
      );

      const savedAttempt = createdDeleteCertificateAttemptInstances[0];

      expect(savedAttempt).toBeDefined();
      expect(savedAttempt.stationId).toBe(MOCK_CHARGING_STATION_ID);
      expect(savedAttempt.hashAlgorithm).toBe(
        mockDeleteCertificateRequest.certificateHashData.hashAlgorithm,
      );
      expect(savedAttempt.issuerNameHash).toBe(
        mockDeleteCertificateRequest.certificateHashData.issuerNameHash,
      );
      expect(savedAttempt.issuerKeyHash).toBe(
        mockDeleteCertificateRequest.certificateHashData.issuerKeyHash,
      );
      expect(savedAttempt.serialNumber).toBe(
        mockDeleteCertificateRequest.certificateHashData.serialNumber,
      );
    });
  });
});
