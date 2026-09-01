// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  CertificateGenerationScope,
  type GenerateCertificateChainRequest,
  type ICertificateRepository,
  type IDeleteCertificateAttemptRepository,
  type IDeviceModelRepository,
  type IInstallCertificateAttemptRepository,
  type IInstalledCertificateRepository,
} from '@citrineos/dal';
import type { CertificateAuthorityService } from '@/services/index.js';
import { WebsocketNetworkConnection } from '@/transport/index.js';
import { BadRequestError } from '@citrineos/base';
import { type WebsocketServerConfig } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallCertificateHelperService } from '@modules/Certificates/installCertificateHelperService.js';
import { mockFileStorage, mockFileStorageGetFile, mockFileStorageSaveFile } from './vitest.setup.js';
import { MOCK_CERTIFICATE } from './providers/InstallCertificateRequestProvider.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

// Define constants BEFORE mocks to avoid hoisting issues
const { MOCK_CERT_TYPE_V2G, MOCK_STATUS_REJECTED, MOCK_STATUS_ACCEPTED } = vi.hoisted(() => ({
  MOCK_CERT_TYPE_V2G: 'V2GRootCertificate',
  MOCK_STATUS_REJECTED: 'Rejected',
  MOCK_STATUS_ACCEPTED: 'Accepted',
}));

const mockExtractCertificateDetails = vi.hoisted(() => vi.fn());
const mockGenerateCertificate = vi.hoisted(() => vi.fn());
const mockParseCertificateChainPem = vi.hoisted(() => vi.fn());
const mockIsSignedBy = vi.hoisted(() => vi.fn());

let createdCertificateInstances: any[] = [];
let createdInstallCertificateAttemptInstances: any[] = [];
let createdInstalledCertificateInstances: any[] = [];
let createdDeleteCertificateAttemptInstances: any[] = [];

vi.mock('jsrsasign', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jsrsasign')>();
  const MockX509 = class {
    readCertPEM = vi.fn();
    getIssuerString = vi.fn().mockReturnValue('mock-issuer');
  };
  return {
    ...actual,
    default: {
      ...(actual as any).default,
      X509: MockX509,
    },
  };
});

vi.mock('@util/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@util/index.js')>();
  return {
    ...actual,
    extractCertificateDetails: mockExtractCertificateDetails,
    generateCertificate: mockGenerateCertificate,
    parseCertificateChainPem: mockParseCertificateChainPem,
    isSignedBy: mockIsSignedBy,
  };
});

vi.mock('@dal/db/sequelize/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dal/db/sequelize/index.js')>();

  class MockCertificate {
    id?: number;
    serialNumber?: number;
    issuerName?: string;
    organizationName?: string;
    commonName?: string;
    countryName?: string;
    validBefore?: string;
    signatureAlgorithm?: string;
    certificateFileId?: string;
    certificateFileHash?: string;
    tenantId?: number;
    save = vi.fn().mockResolvedValue(this);

    constructor() {
      createdCertificateInstances.push(this);
    }

    static build = vi.fn().mockImplementation((data) => {
      const instance = new MockCertificate();
      Object.assign(instance, data);
      return instance;
    });

    static create = vi.fn().mockResolvedValue(undefined);
  }

  class MockInstallCertificateAttempt {
    id?: number;
    ocppConnectionName?: string;
    certificateType?: string;
    certificateId?: number;
    requestId?: number;
    status?: string;
    save = vi.fn().mockResolvedValue(this);

    constructor() {
      createdInstallCertificateAttemptInstances.push(this);
    }

    static build = vi.fn().mockImplementation((data) => {
      const instance = new MockInstallCertificateAttempt();
      Object.assign(instance, data);
      return instance;
    });
  }

  class MockInstalledCertificate {
    id?: number;
    ocppConnectionName?: string;
    certificateId?: number;
    certificateType?: string;
    save = vi.fn().mockResolvedValue(this);

    constructor() {
      createdInstalledCertificateInstances.push(this);
    }

    static build = vi.fn().mockImplementation((data) => {
      const instance = new MockInstalledCertificate();
      Object.assign(instance, data);
      return instance;
    });
  }

  class MockDeleteCertificateAttempt {
    id?: number;
    ocppConnectionName?: string;
    hashAlgorithm?: string;
    issuerNameHash?: string;
    issuerKeyHash?: string;
    serialNumber?: string;
    status?: string;
    tenantId?: number;
    save = vi.fn().mockResolvedValue(this);

    constructor() {
      createdDeleteCertificateAttemptInstances.push(this);
    }
  }

  return {
    ...actual,
    Certificate: MockCertificate,
    InstallCertificateAttempt: MockInstallCertificateAttempt,
    InstalledCertificate: MockInstalledCertificate,
    DeleteCertificateAttempt: MockDeleteCertificateAttempt,
  };
});

describe('InstallCertificateHelperService', () => {
  const { container, logger } = createTestContainer();
  let service: InstallCertificateHelperService;
  let mockCertificateRepository: ICertificateRepository;
  let mockInstalledCertificateRepository: IInstalledCertificateRepository;
  let mockInstallCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  let mockDeleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  let mockDeviceModelRepository: IDeviceModelRepository;
  let mockCertificateAuthorityService: CertificateAuthorityService;
  let mockNetworkConnection: WebsocketNetworkConnection;

  const mockHash = 'abc123hash';
  const tenantId = 1;
  const ocppConnectionName = 'cp001';

  const mockCertificateFindByFileHash = vi.fn();
  const mockCertificateFindById = vi.fn();
  const mockCertificateCreate = vi.fn();
  const mockInstalledFindByStationAndType = vi.fn();
  const mockInstalledFindByIdAndStation = vi.fn();
  const mockInstalledGetLinkedCertificate = vi.fn();
  const mockInstalledCreate = vi.fn();
  const mockInstalledSetCertificateId = vi.fn();
  const mockInstalledUpdateHashData = vi.fn();
  const mockInstalledDeleteByStation = vi.fn();
  const mockInstalledDeleteByStationAndType = vi.fn();
  const mockInstalledDeleteByStationAndHashData = vi.fn();
  const mockInstallCertificateAttemptFindPendingByHash = vi.fn();
  const mockInstallCertificateAttemptFindPending = vi.fn();
  const mockInstallCertificateAttemptCreate = vi.fn();
  const mockInstallCertificateAttemptUpdateStatus = vi.fn();
  const mockInstallCertificateAttemptGetLinkedCertificate = vi.fn();
  const mockDeviceModelReadAllByQuerystring = vi.fn();
  const mockDeleteCertificateAttemptFindPending = vi.fn();
  const mockDeleteCertificateAttemptCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createdCertificateInstances = [];
    createdInstallCertificateAttemptInstances = [];
    createdInstalledCertificateInstances = [];
    createdDeleteCertificateAttemptInstances = [];

    mockCertificateRepository = {
      findByFileHash: mockCertificateFindByFileHash,
      findById: mockCertificateFindById,
      createCertificate: mockCertificateCreate,
      createOrUpdateCertificate: vi.fn(),
    } as any;

    mockInstalledCertificateRepository = {
      findByStationAndType: mockInstalledFindByStationAndType,
      findByIdAndStation: mockInstalledFindByIdAndStation,
      getLinkedCertificate: mockInstalledGetLinkedCertificate,
      createInstalledCertificate: mockInstalledCreate,
      setCertificateId: mockInstalledSetCertificateId,
      updateHashData: mockInstalledUpdateHashData,
      deleteByStation: mockInstalledDeleteByStation,
      deleteByStationAndType: mockInstalledDeleteByStationAndType,
      deleteByStationAndHashData: mockInstalledDeleteByStationAndHashData,
    } as any;

    mockInstallCertificateAttemptRepository = {
      findPendingByStationTypeAndCertHash: mockInstallCertificateAttemptFindPendingByHash,
      findPendingByStation: mockInstallCertificateAttemptFindPending,
      createAttempt: mockInstallCertificateAttemptCreate,
      updateStatus: mockInstallCertificateAttemptUpdateStatus,
      getLinkedCertificate: mockInstallCertificateAttemptGetLinkedCertificate,
    } as any;

    // Defaults to an empty result, i.e. AdditionalRootCertificateCheck is unset/disabled,
    // so existing tests that don't care about M05.FR.10 aren't affected by it.
    mockDeviceModelReadAllByQuerystring.mockResolvedValue([]);
    mockDeviceModelRepository = {
      readAllByQuerystring: mockDeviceModelReadAllByQuerystring,
    } as any;

    mockDeleteCertificateAttemptRepository = {
      findPendingByStationAndHashData: mockDeleteCertificateAttemptFindPending,
      createAttempt: mockDeleteCertificateAttemptCreate,
    } as any;
    mockCertificateAuthorityService = {} as any;
    mockNetworkConnection = {} as any;

    service = getTestInstance(container, InstallCertificateHelperService, {
      certificateRepository: mockCertificateRepository,
      installedCertificateRepository: mockInstalledCertificateRepository,
      installCertificateAttemptRepository: mockInstallCertificateAttemptRepository,
      deleteCertificateAttemptRepository: mockDeleteCertificateAttemptRepository,
      deviceModelRepository: mockDeviceModelRepository,
      certificateAuthorityService: mockCertificateAuthorityService,
      networkConnection: mockNetworkConnection,
      fileStorage: mockFileStorage,
    });

    vi.spyOn(service, 'getCertificateHash').mockReturnValue(mockHash);
  });

  describe('prepareToInstallCertificate', () => {
    it('should not create new install certificate attempt if existing pending attempt exists', async () => {
      const mockExistingAttempt = { id: 1 } as any;
      mockInstallCertificateAttemptFindPendingByHash.mockResolvedValue(mockExistingAttempt);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
      );

      expect(service.getCertificateHash).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(mockInstallCertificateAttemptFindPendingByHash).toHaveBeenCalledWith(
        tenantId,
        ocppConnectionName,
        MOCK_CERT_TYPE_V2G,
        mockHash,
        undefined,
      );
      expect(mockInstallCertificateAttemptCreate).not.toHaveBeenCalled();
    });

    it('should extract certificate details and create new certificate if not exists', async () => {
      const mockCertDetails = {
        serialNumber: 123456,
        issuerName: 'Test Issuer',
        organizationName: 'Test Org',
        commonName: 'localhost',
        countryName: 'US',
        validBefore: new Date('2027-02-17'),
        signatureAlgorithm: 'SHA256withECDSA' as any,
      };

      mockInstallCertificateAttemptFindPendingByHash.mockResolvedValue(undefined);
      mockExtractCertificateDetails.mockReturnValue(mockCertDetails);
      mockCertificateFindByFileHash.mockResolvedValue(undefined);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as any);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
      );

      expect(mockExtractCertificateDetails).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(mockCertificateFindByFileHash).toHaveBeenCalledWith(tenantId, mockHash);
      expect(service.createNewCertificate).toHaveBeenCalledWith(
        tenantId,
        MOCK_CERTIFICATE,
        mockCertDetails.serialNumber,
        mockCertDetails.issuerName,
        mockCertDetails.organizationName,
        mockCertDetails.commonName,
        mockCertDetails.countryName,
        mockCertDetails.validBefore,
        mockCertDetails.signatureAlgorithm,
      );

      expect(mockInstallCertificateAttemptCreate).toHaveBeenCalledWith(tenantId, {
        ocppConnectionName,
        certificateType: MOCK_CERT_TYPE_V2G,
        certificateId: 100,
      });
    });

    it('should include requestId when checking for existing pending attempt', async () => {
      const mockExistingAttempt = { id: 1 } as any;
      mockInstallCertificateAttemptFindPendingByHash.mockResolvedValue(mockExistingAttempt);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
        42,
      );

      expect(mockInstallCertificateAttemptFindPendingByHash).toHaveBeenCalledWith(
        tenantId,
        ocppConnectionName,
        MOCK_CERT_TYPE_V2G,
        mockHash,
        42,
      );
    });

    it('should set requestId on new attempt when provided', async () => {
      const mockCertDetails = {
        serialNumber: 123456,
        issuerName: 'Test Issuer',
        organizationName: 'Test Org',
        commonName: 'localhost',
        countryName: 'US',
        validBefore: new Date('2027-02-17'),
        signatureAlgorithm: 'SHA256withECDSA' as any,
      };

      mockInstallCertificateAttemptFindPendingByHash.mockResolvedValue(undefined);
      mockExtractCertificateDetails.mockReturnValue(mockCertDetails);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as any);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
        42,
      );

      expect(mockInstallCertificateAttemptCreate).toHaveBeenCalledWith(tenantId, {
        ocppConnectionName,
        certificateType: MOCK_CERT_TYPE_V2G,
        certificateId: 100,
        requestId: 42,
      });
    });

    it('should use existing certificate if found and create install attempt', async () => {
      vi.spyOn(service, 'createNewCertificate');

      const mockCertDetails = {
        serialNumber: 123456,
        issuerName: 'Test Issuer',
        organizationName: 'Test Org',
        commonName: 'localhost',
        countryName: 'US',
        validBefore: new Date('2027-02-17'),
        signatureAlgorithm: 'SHA256withECDSA' as any,
      };

      const mockExistingCertificate = { id: 99 } as any;

      mockInstallCertificateAttemptFindPendingByHash.mockResolvedValue(undefined);
      mockExtractCertificateDetails.mockReturnValue(mockCertDetails);
      mockCertificateFindByFileHash.mockResolvedValue(mockExistingCertificate);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
      );

      expect(service.createNewCertificate).not.toHaveBeenCalled();

      expect(mockInstallCertificateAttemptCreate).toHaveBeenCalledWith(tenantId, {
        ocppConnectionName,
        certificateType: MOCK_CERT_TYPE_V2G,
        certificateId: 99,
      });
    });

    describe('AdditionalRootCertificateCheck (M05.FR.10)', () => {
      const MOCK_CERT_TYPE_CSMS_ROOT = 'CSMSRootCertificate';
      const previousRootPemBuffer = Buffer.from('previous-root-pem');

      beforeEach(() => {
        // Common setup for tests that don't short-circuit on an existing pending attempt.
        mockInstallCertificateAttemptFindPendingByHash.mockResolvedValue(undefined);
        mockExtractCertificateDetails.mockReturnValue({
          serialNumber: 1,
          issuerName: 'Test Issuer',
          organizationName: 'Test Org',
          commonName: 'localhost',
          countryName: 'US',
          validBefore: new Date('2027-02-17'),
          signatureAlgorithm: 'SHA256withECDSA' as any,
        });
        mockCertificateFindByFileHash.mockResolvedValue({ id: 1 } as any);
      });

      it('does not consult the device model for non-CSMSRootCertificate types', async () => {
        await service.prepareToInstallCertificate(
          tenantId,
          ocppConnectionName,
          MOCK_CERTIFICATE,
          MOCK_CERT_TYPE_V2G as any,
        );

        expect(mockDeviceModelReadAllByQuerystring).not.toHaveBeenCalled();
      });

      it('skips the check when AdditionalRootCertificateCheck is not set to true', async () => {
        mockDeviceModelReadAllByQuerystring.mockResolvedValue([{ value: 'false' }]);

        await expect(
          service.prepareToInstallCertificate(
            tenantId,
            ocppConnectionName,
            MOCK_CERTIFICATE,
            MOCK_CERT_TYPE_CSMS_ROOT as any,
          ),
        ).resolves.not.toThrow();

        expect(mockDeviceModelReadAllByQuerystring).toHaveBeenCalledWith(tenantId, {
          tenantId,
          ocppConnectionName,
          component_name: 'SecurityCtrlr',
          variable_name: 'AdditionalRootCertificateCheck',
          type: 'Actual',
        });
        expect(mockInstalledFindByStationAndType).not.toHaveBeenCalled();
      });

      it('allows the install when no CSMS root is currently installed (initial install)', async () => {
        mockDeviceModelReadAllByQuerystring.mockResolvedValue([{ value: 'true' }]);
        mockInstalledFindByStationAndType.mockResolvedValue(undefined);

        await expect(
          service.prepareToInstallCertificate(
            tenantId,
            ocppConnectionName,
            MOCK_CERTIFICATE,
            MOCK_CERT_TYPE_CSMS_ROOT as any,
          ),
        ).resolves.not.toThrow();

        expect(mockIsSignedBy).not.toHaveBeenCalled();
      });

      it('throws BadRequestError when the installed root record has no certificate file on record', async () => {
        mockDeviceModelReadAllByQuerystring.mockResolvedValue([{ value: 'true' }]);
        mockInstalledFindByStationAndType.mockResolvedValue({ id: 50 } as any);
        mockInstalledGetLinkedCertificate.mockResolvedValue(undefined);

        await expect(
          service.prepareToInstallCertificate(
            tenantId,
            ocppConnectionName,
            MOCK_CERTIFICATE,
            MOCK_CERT_TYPE_CSMS_ROOT as any,
          ),
        ).rejects.toThrow(BadRequestError);
      });

      it('throws BadRequestError when the new root is not signed by the previous root', async () => {
        mockDeviceModelReadAllByQuerystring.mockResolvedValue([{ value: 'true' }]);
        mockInstalledFindByStationAndType.mockResolvedValue({ id: 50 } as any);
        mockInstalledGetLinkedCertificate.mockResolvedValue({
          certificateFileId: 'root-cert-path',
        } as any);
        mockFileStorageGetFile.mockResolvedValue(previousRootPemBuffer);
        mockIsSignedBy.mockReturnValue(false);

        await expect(
          service.prepareToInstallCertificate(
            tenantId,
            ocppConnectionName,
            MOCK_CERTIFICATE,
            MOCK_CERT_TYPE_CSMS_ROOT as any,
          ),
        ).rejects.toThrow(BadRequestError);

        expect(mockIsSignedBy).toHaveBeenCalledWith(
          MOCK_CERTIFICATE,
          previousRootPemBuffer.toString(),
        );
      });

      it('proceeds with the install when the new root is signed by the previous root', async () => {
        mockDeviceModelReadAllByQuerystring.mockResolvedValue([{ value: 'true' }]);
        mockInstalledFindByStationAndType.mockResolvedValue({ id: 50 } as any);
        mockInstalledGetLinkedCertificate.mockResolvedValue({
          certificateFileId: 'root-cert-path',
        } as any);
        mockFileStorageGetFile.mockResolvedValue(previousRootPemBuffer);
        mockIsSignedBy.mockReturnValue(true);

        await expect(
          service.prepareToInstallCertificate(
            tenantId,
            ocppConnectionName,
            MOCK_CERTIFICATE,
            MOCK_CERT_TYPE_CSMS_ROOT as any,
          ),
        ).resolves.not.toThrow();

        expect(mockInstallCertificateAttemptCreate).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('finalizeInstalledCertificate', () => {
    it('should do nothing if no pending install attempt exists', async () => {
      mockInstallCertificateAttemptFindPending.mockResolvedValue(undefined);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_REJECTED as any,
      );

      expect(mockInstalledFindByStationAndType).not.toHaveBeenCalled();
    });

    it('should update status of pending attempt', async () => {
      const mockAttempt = {
        id: 1,
      } as any;

      mockInstallCertificateAttemptFindPending.mockResolvedValue(mockAttempt);
      mockInstalledFindByStationAndType.mockResolvedValue(undefined);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_REJECTED as any,
      );

      expect(mockInstallCertificateAttemptUpdateStatus).toHaveBeenCalledWith(
        tenantId,
        mockAttempt.id,
        MOCK_STATUS_REJECTED,
      );
    });

    it('should update existing installed certificate if status is Accepted', async () => {
      const mockAttempt = {
        id: 1,
        certificateId: 100,
        certificateType: MOCK_CERT_TYPE_V2G,
      } as any;

      const mockInstalledCert = {
        id: 50,
      } as any;

      mockInstallCertificateAttemptFindPending.mockResolvedValue(mockAttempt);
      mockInstalledFindByStationAndType.mockResolvedValue(mockInstalledCert);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_ACCEPTED as any,
      );

      expect(mockInstalledSetCertificateId).toHaveBeenCalledWith(tenantId, 50, 100);
    });

    it('should create new installed certificate if none exists and file is retrieved', async () => {
      const mockCertificate = {
        id: 100,
        certificateFileId: 'file123',
      } as any;

      const mockAttempt = {
        id: 1,
        certificateId: 100,
        certificateType: MOCK_CERT_TYPE_V2G,
      } as any;

      mockInstallCertificateAttemptFindPending.mockResolvedValue(mockAttempt);
      mockInstallCertificateAttemptGetLinkedCertificate.mockResolvedValue(mockCertificate);
      mockInstalledFindByStationAndType.mockResolvedValue(undefined);
      mockFileStorageGetFile.mockResolvedValue(Buffer.from(MOCK_CERTIFICATE));

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_ACCEPTED as any,
      );

      expect(mockInstallCertificateAttemptGetLinkedCertificate).toHaveBeenCalledWith(
        tenantId,
        mockAttempt.id,
      );
      expect(mockFileStorageGetFile).toHaveBeenCalledWith('file123');

      expect(mockInstalledCreate).toHaveBeenCalledWith(tenantId, {
        ocppConnectionName,
        certificateType: MOCK_CERT_TYPE_V2G,
        certificateId: 100,
      });
    });

    it('should include requestId in lookup query when provided', async () => {
      const mockAttempt = {
        id: 1,
      } as any;

      mockInstallCertificateAttemptFindPending.mockResolvedValue(mockAttempt);
      mockInstalledFindByStationAndType.mockResolvedValue(undefined);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_REJECTED as any,
        42,
      );

      expect(mockInstallCertificateAttemptFindPending).toHaveBeenCalledWith(
        tenantId,
        ocppConnectionName,
        42,
        undefined,
      );
    });

    it('should log error and return if file retrieval fails', async () => {
      const mockCertificate = {
        id: 100,
        certificateFileId: 'file123',
      } as any;

      const mockAttempt = {
        id: 1,
        certificateId: 100,
        certificateType: MOCK_CERT_TYPE_V2G,
      } as any;

      mockInstallCertificateAttemptFindPending.mockResolvedValue(mockAttempt);
      mockInstallCertificateAttemptGetLinkedCertificate.mockResolvedValue(mockCertificate);
      mockInstalledFindByStationAndType.mockResolvedValue(undefined);
      mockFileStorageGetFile.mockResolvedValue(null);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_ACCEPTED as any,
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to retrieve certificate file from storage for certificate',
        {
          certificateFileId: 'file123',
          id: 100,
        },
      );
      expect(mockInstalledCreate).not.toHaveBeenCalled();
    });
  });

  describe('createNewCertificate', () => {
    it('should call getCertificateHash and save file', async () => {
      mockFileStorageSaveFile.mockResolvedValue('fileId123');
      mockCertificateCreate.mockResolvedValue({ id: 1 });

      await service.createNewCertificate(
        tenantId,
        MOCK_CERTIFICATE,
        123456,
        'Test Issuer',
        'Test Org',
        'localhost',
        'US' as any,
        new Date('2027-02-17'),
        'SHA256withECDSA' as any,
      );

      expect(service.getCertificateHash).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(mockFileStorageSaveFile).toHaveBeenCalledWith(
        `Existing_Cert_123456.pem`,
        Buffer.from(MOCK_CERTIFICATE),
      );
      expect(mockCertificateCreate).toHaveBeenCalled();
    });

    it('should save certificate record with correct values', async () => {
      mockFileStorageSaveFile.mockResolvedValue('fileId123');
      const createdCertificate = {
        id: 5,
        serialNumber: 123456,
        issuerName: 'Test Issuer',
        certificateFileHash: mockHash,
      };
      mockCertificateCreate.mockResolvedValue(createdCertificate);

      const result = await service.createNewCertificate(
        tenantId,
        MOCK_CERTIFICATE,
        123456,
        'Test Issuer',
        'Test Org',
        'localhost',
        'US' as any,
        new Date('2027-02-17'),
        'SHA256withECDSA' as any,
      );

      expect(mockCertificateCreate).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          serialNumber: 123456,
          issuerName: 'Test Issuer',
          certificateFileHash: mockHash,
          certificateFileId: 'fileId123',
        }),
      );
      expect(result).toBe(createdCertificate);
    });
  });

  describe('handleUploadExistingCertificate', () => {
    const mockCertDetails = {
      serialNumber: 123456,
      issuerName: 'Test Issuer',
      organizationName: 'Test Org',
      commonName: 'localhost',
      countryName: 'US',
      validBefore: new Date('2027-02-17'),
      signatureAlgorithm: 'SHA256withECDSA' as any,
    };

    const mockUploadRequest = {
      certificateType: MOCK_CERT_TYPE_V2G,
      certificate: MOCK_CERTIFICATE,
    } as any;

    beforeEach(() => {
      mockExtractCertificateDetails.mockReturnValue(mockCertDetails);
    });

    it('should extract certificate details', async () => {
      mockInstalledFindByStationAndType.mockResolvedValue(undefined);
      mockCertificateFindByFileHash.mockResolvedValue(undefined);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as any);

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(mockExtractCertificateDetails).toHaveBeenCalledWith(MOCK_CERTIFICATE);
    });

    it('should throw error if certificate already exists with fileId', async () => {
      const mockExistingCert = { id: 99, certificateFileId: 'existingFile' } as any;

      mockInstalledFindByStationAndType.mockResolvedValue({ id: 50 } as any);
      mockInstalledGetLinkedCertificate.mockResolvedValue(mockExistingCert);

      await expect(
        service.handleUploadExistingCertificate(tenantId, ocppConnectionName, mockUploadRequest),
      ).rejects.toThrow('Cannot upload exiting certificate because it already exists');
    });

    it('should save file and update certificate if fileId is missing', async () => {
      const mockExistingCert = {
        id: 99,
        certificateFileId: undefined,
      } as any;

      mockInstalledFindByStationAndType.mockResolvedValue({ id: 50 } as any);
      mockInstalledGetLinkedCertificate.mockResolvedValue(mockExistingCert);
      mockFileStorageSaveFile.mockResolvedValue('newFileId');

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
        '/custom/path',
      );

      expect(mockFileStorageSaveFile).toHaveBeenCalledWith(
        `/custom/path/Existing_Key_${mockCertDetails.serialNumber}.pem`,
        Buffer.from(MOCK_CERTIFICATE),
      );
      expect(mockExistingCert.certificateFileId).toBe('newFileId');
      expect(mockCertificateCreate).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ certificateFileId: 'newFileId' }),
      );
    });

    it('should get or create certificate and update installed cert if no cert tied', async () => {
      const mockExistingCert = { id: 99 } as any;

      mockInstalledFindByStationAndType.mockResolvedValue({ id: 50 } as any);
      mockInstalledGetLinkedCertificate.mockResolvedValue(null);
      mockCertificateFindByFileHash.mockResolvedValue(mockExistingCert);
      mockInstalledSetCertificateId.mockResolvedValue({ id: 50, certificateId: 99 } as any);

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(mockCertificateFindByFileHash).toHaveBeenCalledWith(tenantId, mockHash);
      expect(mockInstalledSetCertificateId).toHaveBeenCalledWith(tenantId, 50, 99);
    });

    it('should create new certificate if not found when no cert tied', async () => {
      mockInstalledFindByStationAndType.mockResolvedValue({ id: 50 } as any);
      mockInstalledGetLinkedCertificate.mockResolvedValue(null);
      mockCertificateFindByFileHash.mockResolvedValue(undefined);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as any);
      mockInstalledSetCertificateId.mockResolvedValue({ id: 50, certificateId: 100 } as any);

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(service.createNewCertificate).toHaveBeenCalled();
      expect(mockInstalledSetCertificateId).toHaveBeenCalledWith(tenantId, 50, 100);
    });

    it('should create new installed certificate if none exists', async () => {
      const mockExistingCert = { id: 99 } as any;
      const mockCreatedInstalled = { id: 200 } as any;

      mockInstalledFindByStationAndType.mockResolvedValue(undefined);
      mockCertificateFindByFileHash.mockResolvedValue(mockExistingCert);
      mockInstalledCreate.mockResolvedValue(mockCreatedInstalled);

      const result = await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(mockInstalledCreate).toHaveBeenCalledWith(tenantId, {
        ocppConnectionName,
        certificateType: MOCK_CERT_TYPE_V2G,
        certificateId: 99,
      });
      expect(result).toBe(mockCreatedInstalled);
    });

    it('should create certificate and installed cert if neither exist', async () => {
      mockInstalledFindByStationAndType.mockResolvedValue(undefined);
      mockCertificateFindByFileHash.mockResolvedValue(undefined);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as any);
      mockInstalledCreate.mockResolvedValue({ id: 200 } as any);

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(service.createNewCertificate).toHaveBeenCalledWith(
        tenantId,
        MOCK_CERTIFICATE,
        mockCertDetails.serialNumber,
        mockCertDetails.issuerName,
        mockCertDetails.organizationName,
        mockCertDetails.commonName,
        mockCertDetails.countryName,
        mockCertDetails.validBefore,
        mockCertDetails.signatureAlgorithm,
      );

      expect(mockInstalledCreate).toHaveBeenCalledWith(tenantId, {
        ocppConnectionName,
        certificateType: MOCK_CERT_TYPE_V2G,
        certificateId: 100,
      });
    });
  });

  describe('generateCertificateChain', () => {
    const baseCertRequest = {
      organizationName: 'Test Org',
      commonName: 'localhost',
    } as GenerateCertificateChainRequest;

    const baseWebsocketConfig = {
      id: 'server-1',
      securityProfile: 2,
    } as WebsocketServerConfig;

    beforeEach(() => {
      mockFileStorageSaveFile.mockImplementation((key: string) => Promise.resolve(key));
      (mockCertificateRepository.createOrUpdateCertificate as any).mockImplementation(
        (_tenantId: number, cert: any) =>
          Promise.resolve(Object.assign(cert, { id: cert.id ?? 999 })),
      );
    });

    describe('Leaf scope (default)', () => {
      const websocketConfig: WebsocketServerConfig = {
        ...baseWebsocketConfig,
        tlsCertificateChainFilePath: 'chain.pem',
      };
      const certRequest = {
        ...baseCertRequest,
        generationScope: CertificateGenerationScope.Leaf,
      } as GenerateCertificateChainRequest;

      it('is used when generationScope is omitted, throwing if root+subCA do not already exist', async () => {
        // baseCertRequest has no generationScope set — Leaf is the default, so omitting
        // it against a server with no existing chain should throw, not silently succeed.
        await expect(
          service.generateCertificateChain(tenantId, baseWebsocketConfig, baseCertRequest),
        ).rejects.toThrow(BadRequestError);
      });

      it('throws BadRequestError if the certificate chain path is not configured', async () => {
        const incompleteConfig = { ...websocketConfig, tlsCertificateChainFilePath: undefined };

        await expect(
          service.generateCertificateChain(tenantId, incompleteConfig, certRequest),
        ).rejects.toThrow(BadRequestError);
      });

      it('throws BadRequestError if chain file cannot be read', async () => {
        mockFileStorageGetFile.mockResolvedValueOnce(null);

        await expect(
          service.generateCertificateChain(tenantId, websocketConfig, certRequest),
        ).rejects.toThrow(BadRequestError);
      });

      it('throws BadRequestError if the subCA record has no private key on file', async () => {
        mockFileStorageGetFile.mockResolvedValueOnce(Buffer.from('oldLeafPem+subCACertPem'));
        mockParseCertificateChainPem.mockReturnValue(['oldLeafPem', 'subCACertPem']);
        mockCertificateFindByFileHash.mockResolvedValue({
          id: 55,
          privateKeyFileId: undefined,
        });

        await expect(
          service.generateCertificateChain(tenantId, websocketConfig, certRequest),
        ).rejects.toThrow(BadRequestError);
      });

      it('regenerates only the leaf, reusing the existing subCA', async () => {
        mockFileStorageGetFile
          .mockResolvedValueOnce(Buffer.from('oldLeafPem+subCACertPem'))
          .mockResolvedValueOnce(Buffer.from('subCAKeyPem'));
        mockParseCertificateChainPem.mockReturnValue(['oldLeafPem', 'subCACertPem']);
        mockCertificateFindByFileHash.mockResolvedValue({
          id: 55,
          privateKeyFileId: 'SubCA_Key_existing.pem',
        });
        mockGenerateCertificate.mockReturnValue(['newLeafPem', 'newLeafKeyPem']);

        const result = await service.generateCertificateChain(
          tenantId,
          websocketConfig,
          certRequest,
        );

        expect(mockFileStorageGetFile).toHaveBeenCalledWith('chain.pem', undefined, {
          trusted: true,
        });
        expect(mockFileStorageGetFile).toHaveBeenCalledWith(
          'SubCA_Key_existing.pem',
          undefined,
          undefined,
        );
        expect(mockParseCertificateChainPem).toHaveBeenCalledWith('oldLeafPem+subCACertPem');
        expect(mockCertificateFindByFileHash).toHaveBeenCalledWith(tenantId, mockHash);
        expect(mockGenerateCertificate).toHaveBeenCalledWith(
          expect.objectContaining({ signedBy: 55, commonName: 'localhost' }),
          logger,
          'subCAKeyPem',
          'subCACertPem',
        );
        expect(result.certificates).toHaveLength(1);
        expect(result.filePaths.tlsKeyFilePath).toMatch(/^Leaf_Key_\d+\.pem$/);
        expect(result.filePaths.tlsCertificateChainFilePath).toMatch(/^Cert_Chain_\d+\.pem$/);
        expect(result.filePaths.mtlsCertificateAuthorityKeyFilePath).toBeUndefined();
        expect(result.filePaths.rootCACertificateFilePath).toBeUndefined();
      });
    });

    describe('SubCAAndLeaf scope', () => {
      const websocketConfig: WebsocketServerConfig = {
        ...baseWebsocketConfig,
        tlsCertificateChainFilePath: 'chain.pem',
      };
      const certRequest = {
        ...baseCertRequest,
        generationScope: CertificateGenerationScope.SubCAAndLeaf,
      } as GenerateCertificateChainRequest;

      it('throws BadRequestError if the certificate chain path is not configured', async () => {
        const incompleteConfig = { ...websocketConfig, tlsCertificateChainFilePath: undefined };

        await expect(
          service.generateCertificateChain(tenantId, incompleteConfig, certRequest),
        ).rejects.toThrow(BadRequestError);
      });

      it('throws BadRequestError if the current subCA has no locally-generated root to reuse', async () => {
        mockFileStorageGetFile.mockResolvedValueOnce(Buffer.from('leafPem+subCACertPem'));
        mockParseCertificateChainPem.mockReturnValue(['leafPem', 'subCACertPem']);
        mockCertificateFindByFileHash.mockResolvedValue({ id: 20, signedBy: null });

        await expect(
          service.generateCertificateChain(tenantId, websocketConfig, certRequest),
        ).rejects.toThrow(BadRequestError);
      });

      it('throws BadRequestError if the root record is missing its certificate or private key', async () => {
        mockFileStorageGetFile.mockResolvedValueOnce(Buffer.from('leafPem+subCACertPem'));
        mockParseCertificateChainPem.mockReturnValue(['leafPem', 'subCACertPem']);
        mockCertificateFindByFileHash.mockResolvedValue({ id: 20, signedBy: 10 });
        mockCertificateFindById.mockResolvedValue({
          id: 10,
          certificateFileId: undefined,
          privateKeyFileId: undefined,
        });

        await expect(
          service.generateCertificateChain(tenantId, websocketConfig, certRequest),
        ).rejects.toThrow(BadRequestError);
      });

      it('regenerates subCA and leaf, reusing the existing root', async () => {
        mockFileStorageGetFile
          .mockResolvedValueOnce(Buffer.from('leafPem+subCACertPem'))
          .mockResolvedValueOnce(Buffer.from('rootCertPem'))
          .mockResolvedValueOnce(Buffer.from('rootKeyPem'));
        mockParseCertificateChainPem.mockReturnValue(['leafPem', 'subCACertPem']);
        mockCertificateFindByFileHash.mockResolvedValue({ id: 20, signedBy: 10 });
        mockCertificateFindById.mockResolvedValue({
          id: 10,
          certificateFileId: 'Root_Certificate_existing.pem',
          privateKeyFileId: 'Root_Key_existing.pem',
        });
        mockGenerateCertificate
          .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
          .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

        const result = await service.generateCertificateChain(
          tenantId,
          websocketConfig,
          certRequest,
        );

        expect(mockFileStorageGetFile).toHaveBeenCalledWith('chain.pem', undefined, {
          trusted: true,
        });
        expect(mockFileStorageGetFile).toHaveBeenCalledWith(
          'Root_Certificate_existing.pem',
          undefined,
          undefined,
        );
        expect(mockFileStorageGetFile).toHaveBeenCalledWith(
          'Root_Key_existing.pem',
          undefined,
          undefined,
        );
        expect(mockGenerateCertificate).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ signedBy: 10, commonName: 'localhost SubCA' }),
          logger,
          'rootKeyPem',
          'rootCertPem',
        );
        expect(mockGenerateCertificate).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ signedBy: 999, commonName: 'localhost' }),
          logger,
          'newSubCAKeyPem',
          'newSubCACertPem',
        );
        expect(result.certificates).toHaveLength(2);
        expect(result.filePaths.tlsKeyFilePath).toMatch(/^Leaf_Key_\d+\.pem$/);
        expect(result.filePaths.mtlsCertificateAuthorityKeyFilePath).toMatch(
          /^SubCA_Key_\d+\.pem$/,
        );
        expect(result.filePaths.rootCACertificateFilePath).toBeUndefined();
      });
    });

    describe('FullChain scope', () => {
      it('defaults to a self-signed root when selfSigned is not specified', async () => {
        const certRequest = {
          ...baseCertRequest,
          generationScope: CertificateGenerationScope.FullChain,
        } as GenerateCertificateChainRequest;

        mockGenerateCertificate
          .mockReturnValueOnce(['newRootCertPem', 'newRootKeyPem'])
          .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
          .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

        const result = await service.generateCertificateChain(
          tenantId,
          baseWebsocketConfig,
          certRequest,
        );

        expect(result.certificates).toHaveLength(3);
        expect(result.filePaths.rootCACertificateFilePath).toMatch(/^Root_Certificate_\d+\.pem$/);
      });

      it('generates a new self-signed root, subCA, and leaf when selfSigned is true', async () => {
        const certRequest = {
          ...baseCertRequest,
          selfSigned: true,
          generationScope: CertificateGenerationScope.FullChain,
        } as GenerateCertificateChainRequest;

        mockGenerateCertificate
          .mockReturnValueOnce(['newRootCertPem', 'newRootKeyPem'])
          .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
          .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

        const result = await service.generateCertificateChain(
          tenantId,
          baseWebsocketConfig,
          certRequest,
        );

        expect(mockGenerateCertificate).toHaveBeenCalledTimes(3);
        expect(result.certificates).toHaveLength(3);
        expect(result.filePaths.tlsKeyFilePath).toMatch(/^Leaf_Key_\d+\.pem$/);
        expect(result.filePaths.mtlsCertificateAuthorityKeyFilePath).toMatch(
          /^SubCA_Key_\d+\.pem$/,
        );
        expect(result.filePaths.rootCACertificateFilePath).toMatch(/^Root_Certificate_\d+\.pem$/);
      });

      it('generates a subCA signed by an external CA and a leaf when selfSigned is false', async () => {
        const certRequest = {
          ...baseCertRequest,
          selfSigned: false,
          generationScope: CertificateGenerationScope.FullChain,
        } as GenerateCertificateChainRequest;

        vi.spyOn(service, 'generateSubCACertificateSignedByCAServer').mockResolvedValue([
          'externalSubCACertPem',
          'externalSubCAKeyPem',
        ]);
        mockGenerateCertificate.mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

        const result = await service.generateCertificateChain(
          tenantId,
          baseWebsocketConfig,
          certRequest,
        );

        expect(service.generateSubCACertificateSignedByCAServer).toHaveBeenCalled();
        expect(mockGenerateCertificate).toHaveBeenCalledTimes(1);
        expect(result.certificates).toHaveLength(2);
        expect(result.filePaths.rootCACertificateFilePath).toBeUndefined();
      });

      describe('signWithPreviousRoot / overridePreviousRoot (M05.FR.10)', () => {
        it("signs the new root with the server's currently configured root by default", async () => {
          const websocketConfig: WebsocketServerConfig = {
            ...baseWebsocketConfig,
            rootCACertificateFilePath: 'Root_Certificate_existing.pem',
          };
          const certRequest = {
            ...baseCertRequest,
            generationScope: CertificateGenerationScope.FullChain,
          } as GenerateCertificateChainRequest;

          mockFileStorageGetFile
            .mockResolvedValueOnce(Buffer.from('previousRootCertPem'))
            .mockResolvedValueOnce(Buffer.from('previousRootKeyPem'));
          mockCertificateFindByFileHash.mockResolvedValue({
            id: 77,
            privateKeyFileId: 'Root_Key_existing.pem',
          });
          mockGenerateCertificate
            .mockReturnValueOnce(['newRootCertPem', 'newRootKeyPem'])
            .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
            .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

          const result = await service.generateCertificateChain(
            tenantId,
            websocketConfig,
            certRequest,
          );

          expect(mockFileStorageGetFile).toHaveBeenCalledWith(
            'Root_Certificate_existing.pem',
            undefined,
            { trusted: true },
          );
          expect(mockFileStorageGetFile).toHaveBeenCalledWith(
            'Root_Key_existing.pem',
            undefined,
            undefined,
          );
          expect(mockGenerateCertificate).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ signedBy: 77 }),
            logger,
            'previousRootKeyPem',
            'previousRootCertPem',
          );
          expect(result.certificates).toHaveLength(3);
        });

        it("uses overridePreviousRoot instead of the server's currently configured root", async () => {
          const websocketConfig: WebsocketServerConfig = {
            ...baseWebsocketConfig,
            rootCACertificateFilePath: 'Root_Certificate_current.pem',
          };
          const certRequest = {
            ...baseCertRequest,
            generationScope: CertificateGenerationScope.FullChain,
            overridePreviousRoot: 'Root_Certificate_other.pem',
          } as GenerateCertificateChainRequest;

          mockFileStorageGetFile
            .mockResolvedValueOnce(Buffer.from('otherRootCertPem'))
            .mockResolvedValueOnce(Buffer.from('otherRootKeyPem'));
          mockCertificateFindByFileHash.mockResolvedValue({
            id: 88,
            privateKeyFileId: 'Root_Key_other.pem',
          });
          mockGenerateCertificate
            .mockReturnValueOnce(['newRootCertPem', 'newRootKeyPem'])
            .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
            .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

          await service.generateCertificateChain(tenantId, websocketConfig, certRequest);

          expect(mockFileStorageGetFile).toHaveBeenCalledWith(
            'Root_Certificate_other.pem',
            undefined,
            undefined,
          );
          expect(mockFileStorageGetFile).not.toHaveBeenCalledWith(
            'Root_Certificate_current.pem',
            expect.anything(),
            expect.anything(),
          );
        });

        it('self-signs when signWithPreviousRoot is false, even if a previous root exists', async () => {
          const websocketConfig: WebsocketServerConfig = {
            ...baseWebsocketConfig,
            rootCACertificateFilePath: 'Root_Certificate_existing.pem',
          };
          const certRequest = {
            ...baseCertRequest,
            generationScope: CertificateGenerationScope.FullChain,
            signWithPreviousRoot: false,
          } as GenerateCertificateChainRequest;

          mockGenerateCertificate
            .mockReturnValueOnce(['newRootCertPem', 'newRootKeyPem'])
            .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
            .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

          await service.generateCertificateChain(tenantId, websocketConfig, certRequest);

          expect(mockFileStorageGetFile).not.toHaveBeenCalled();
          expect(mockGenerateCertificate).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ commonName: 'localhost Root' }),
            logger,
          );
        });

        it('falls back to self-signing when there is no previous root to sign with (bootstrap)', async () => {
          // baseWebsocketConfig has no rootCACertificateFilePath and certRequest has no
          // overridePreviousRoot — signWithPreviousRoot defaults to true, but there's
          // nothing to sign with yet, so this must not throw and must self-sign.
          const certRequest = {
            ...baseCertRequest,
            generationScope: CertificateGenerationScope.FullChain,
          } as GenerateCertificateChainRequest;

          mockGenerateCertificate
            .mockReturnValueOnce(['newRootCertPem', 'newRootKeyPem'])
            .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
            .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

          const result = await service.generateCertificateChain(
            tenantId,
            baseWebsocketConfig,
            certRequest,
          );

          expect(mockFileStorageGetFile).not.toHaveBeenCalled();
          expect(mockGenerateCertificate).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ commonName: 'localhost Root' }),
            logger,
          );
          expect(result.certificates).toHaveLength(3);
        });

        it('throws BadRequestError when the previous root is not tracked in the database', async () => {
          const websocketConfig: WebsocketServerConfig = {
            ...baseWebsocketConfig,
            rootCACertificateFilePath: 'Root_Certificate_existing.pem',
          };
          const certRequest = {
            ...baseCertRequest,
            generationScope: CertificateGenerationScope.FullChain,
          } as GenerateCertificateChainRequest;

          mockFileStorageGetFile.mockResolvedValueOnce(Buffer.from('previousRootCertPem'));
          mockCertificateFindByFileHash.mockResolvedValue(undefined);

          await expect(
            service.generateCertificateChain(tenantId, websocketConfig, certRequest),
          ).rejects.toThrow(BadRequestError);
        });

        it('throws BadRequestError when the previous root record is missing its private key', async () => {
          const websocketConfig: WebsocketServerConfig = {
            ...baseWebsocketConfig,
            rootCACertificateFilePath: 'Root_Certificate_existing.pem',
          };
          const certRequest = {
            ...baseCertRequest,
            generationScope: CertificateGenerationScope.FullChain,
          } as GenerateCertificateChainRequest;

          mockFileStorageGetFile.mockResolvedValueOnce(Buffer.from('previousRootCertPem'));
          mockCertificateFindByFileHash.mockResolvedValue({
            id: 77,
            privateKeyFileId: undefined,
          });

          await expect(
            service.generateCertificateChain(tenantId, websocketConfig, certRequest),
          ).rejects.toThrow(BadRequestError);
        });
      });
    });
  });

  describe('generateStandaloneFullChain', () => {
    const baseCertRequest = {
      organizationName: 'Test Org',
      commonName: 'localhost',
    } as GenerateCertificateChainRequest;

    beforeEach(() => {
      mockFileStorageSaveFile.mockImplementation((key: string) => Promise.resolve(key));
      (mockCertificateRepository.createOrUpdateCertificate as any).mockImplementation(
        (_tenantId: number, cert: any) =>
          Promise.resolve(Object.assign(cert, { id: cert.id ?? 999 })),
      );
    });

    it('self-signs the root when there is no override and no prior server to reuse', async () => {
      mockGenerateCertificate
        .mockReturnValueOnce(['newRootCertPem', 'newRootKeyPem'])
        .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
        .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

      const result = await service.generateStandaloneFullChain(tenantId, baseCertRequest);

      expect(mockFileStorageGetFile).not.toHaveBeenCalled();
      expect(mockGenerateCertificate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ commonName: 'localhost Root' }),
        logger,
      );
      expect(result.certificates).toHaveLength(3);
    });

    it('ignores overridePreviousRoot and signWithPreviousRoot, always self-signing', async () => {
      // A standalone chain isn't tied to any server's previous root, so both fields are
      // ignored even when explicitly set — it must not attempt to read or sign with them.
      const certRequest = {
        ...baseCertRequest,
        overridePreviousRoot: 'Root_Certificate_other.pem',
        signWithPreviousRoot: true,
      } as GenerateCertificateChainRequest;

      mockGenerateCertificate
        .mockReturnValueOnce(['newRootCertPem', 'newRootKeyPem'])
        .mockReturnValueOnce(['newSubCACertPem', 'newSubCAKeyPem'])
        .mockReturnValueOnce(['newLeafPem', 'newLeafKeyPem']);

      const result = await service.generateStandaloneFullChain(tenantId, certRequest);

      expect(mockFileStorageGetFile).not.toHaveBeenCalled();
      expect(mockGenerateCertificate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ commonName: 'localhost Root' }),
        logger,
      );
      expect(result.certificates).toHaveLength(3);
    });
  });

  describe('groupServersForGeneration', () => {
    beforeEach(() => {
      // The outer beforeEach pins getCertificateHash to a single constant, which would
      // make every server look like it shares a lineage. These tests need distinct
      // hashes per distinct PEM content to distinguish "shared" from "different".
      vi.spyOn(service, 'getCertificateHash').mockImplementation((pem: string) => pem);
    });

    it('returns one group containing every server for FullChain, without reading any files', async () => {
      const configA = { id: 'a' } as any;
      const configB = { id: 'b' } as any;

      const groups = await service.groupServersForGeneration(
        tenantId,
        [configA, configB],
        CertificateGenerationScope.FullChain,
      );

      expect(groups).toEqual([[configA, configB]]);
      expect(mockFileStorageGetFile).not.toHaveBeenCalled();
    });

    describe('SubCAAndLeaf scope', () => {
      const configA = { id: 'a', tlsCertificateChainFilePath: 'chain-a.pem' } as any;
      const configB = { id: 'b', tlsCertificateChainFilePath: 'chain-b.pem' } as any;

      beforeEach(() => {
        mockFileStorageGetFile.mockImplementation((path: string) =>
          Promise.resolve(Buffer.from(path)),
        );
        // Each config's chain resolves to its own distinct subCA cert (never the same
        // subCA reused across servers) — grouping instead hinges on the DB's signedBy.
        mockParseCertificateChainPem.mockImplementation((pem: string) => ['leaf', `subCA-${pem}`]);
      });

      it('groups servers whose current (distinct) subCAs were signed by the same root', async () => {
        mockCertificateFindByFileHash.mockResolvedValue({ id: 1, signedBy: 100 });

        const groups = await service.groupServersForGeneration(
          tenantId,
          [configA, configB],
          CertificateGenerationScope.SubCAAndLeaf,
        );

        expect(groups).toEqual([[configA, configB]]);
      });

      it('splits servers into separate groups when their subCAs were signed by different roots', async () => {
        mockCertificateFindByFileHash.mockImplementation((_tenantId: number, hash: string) =>
          Promise.resolve(
            hash === 'subCA-chain-a.pem' ? { id: 1, signedBy: 100 } : { id: 2, signedBy: 200 },
          ),
        );

        const groups = await service.groupServersForGeneration(
          tenantId,
          [configA, configB],
          CertificateGenerationScope.SubCAAndLeaf,
        );

        expect(groups).toEqual([[configA], [configB]]);
      });

      it('throws BadRequestError if the current subCA has no locally-generated root to reuse', async () => {
        mockCertificateFindByFileHash.mockResolvedValue({ id: 1, signedBy: null });

        await expect(
          service.groupServersForGeneration(
            tenantId,
            [configA],
            CertificateGenerationScope.SubCAAndLeaf,
          ),
        ).rejects.toThrow(BadRequestError);
      });

      it('throws BadRequestError if a server has no certificate chain configured', async () => {
        const configWithoutChain = { id: 'a' } as any;

        await expect(
          service.groupServersForGeneration(
            tenantId,
            [configWithoutChain],
            CertificateGenerationScope.SubCAAndLeaf,
          ),
        ).rejects.toThrow(BadRequestError);
      });
    });

    describe('Leaf scope', () => {
      it('groups servers that currently share the same subCA certificate', async () => {
        const configA = { id: 'a', tlsCertificateChainFilePath: 'chain-a.pem' } as any;
        const configB = { id: 'b', tlsCertificateChainFilePath: 'chain-b.pem' } as any;
        mockFileStorageGetFile.mockImplementation((path: string) =>
          Promise.resolve(Buffer.from(path)),
        );
        mockParseCertificateChainPem.mockImplementation((pem: string) => [
          `leafOf-${pem}`,
          'sharedSubCAPem',
        ]);

        const groups = await service.groupServersForGeneration(
          tenantId,
          [configA, configB],
          CertificateGenerationScope.Leaf,
        );

        expect(groups).toEqual([[configA, configB]]);
      });

      it('splits servers into separate groups when their subCA certificates differ', async () => {
        const configA = { id: 'a', tlsCertificateChainFilePath: 'chain-a.pem' } as any;
        const configB = { id: 'b', tlsCertificateChainFilePath: 'chain-b.pem' } as any;
        mockFileStorageGetFile.mockImplementation((path: string) =>
          Promise.resolve(Buffer.from(path)),
        );
        mockParseCertificateChainPem.mockImplementation((pem: string) => ['leaf', `subCA-${pem}`]);

        const groups = await service.groupServersForGeneration(
          tenantId,
          [configA, configB],
          CertificateGenerationScope.Leaf,
        );

        expect(groups).toEqual([[configA], [configB]]);
      });

      it('throws BadRequestError if a server has no certificate chain configured', async () => {
        const configA = { id: 'a' } as any;

        await expect(
          service.groupServersForGeneration(tenantId, [configA], CertificateGenerationScope.Leaf),
        ).rejects.toThrow(BadRequestError);
      });
    });
  });

  describe('prepareToDeleteCertificate', () => {
    const certificateHashData = {
      hashAlgorithm: 'SHA256',
      issuerNameHash: 'issuer-name-hash',
      issuerKeyHash: 'issuer-key-hash',
      serialNumber: 'serial-1',
    } as any;

    it('dedupes on all four hash fields plus a null status', async () => {
      mockDeleteCertificateAttemptFindPending.mockResolvedValue(undefined);

      await service.prepareToDeleteCertificate(tenantId, ocppConnectionName, certificateHashData);

      expect(mockDeleteCertificateAttemptFindPending).toHaveBeenCalledWith(
        tenantId,
        ocppConnectionName,
        certificateHashData,
      );
    });

    it('creates an attempt carrying the hash data when none is pending', async () => {
      mockDeleteCertificateAttemptFindPending.mockResolvedValue(undefined);

      await service.prepareToDeleteCertificate(tenantId, ocppConnectionName, certificateHashData);

      expect(mockDeleteCertificateAttemptCreate).toHaveBeenCalledWith(tenantId, {
        ocppConnectionName,
        hashAlgorithm: certificateHashData.hashAlgorithm,
        issuerNameHash: certificateHashData.issuerNameHash,
        issuerKeyHash: certificateHashData.issuerKeyHash,
        serialNumber: certificateHashData.serialNumber,
      });
    });

    it('does not create a second attempt when one is already pending', async () => {
      mockDeleteCertificateAttemptFindPending.mockResolvedValue({ id: 50 });

      await service.prepareToDeleteCertificate(tenantId, ocppConnectionName, certificateHashData);

      expect(mockDeleteCertificateAttemptCreate).not.toHaveBeenCalled();
    });
  });
});
