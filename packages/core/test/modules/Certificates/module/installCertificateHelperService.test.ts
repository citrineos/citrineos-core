// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type CertificateAuthorityService,
  CertificateGenerationScope,
  type GenerateCertificateChainRequest,
  type ICertificateRepository,
  type IDeleteCertificateAttemptRepository,
  type IDeviceModelRepository,
  type IInstallCertificateAttemptRepository,
  type IInstalledCertificateRepository,
  WebsocketNetworkConnection,
} from '@citrineos/core';
import { BadRequestError } from '@citrineos/base';
import { type WebsocketServerConfig } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Certificate } from '@dal/layers/sequelize/index.js';
import { InstallCertificateHelperService } from '@modules/Certificates/src/module/installCertificateHelperService';
import { mockFileStorage, mockFileStorageGetFile, mockFileStorageSaveFile } from '../vitest.setup';
import { MOCK_CERTIFICATE } from '../providers/InstallCertificateRequestProvider';
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

vi.mock('@dal/layers/sequelize/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dal/layers/sequelize/index.js')>();

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

  const mockCertificateReadOnlyOneByQuery = vi.fn();
  const mockInstalledCertificateReadOnlyOneByQuery = vi.fn();
  const mockInstallCertificateAttemptReadOnlyOneByQuery = vi.fn();
  const mockDeviceModelReadAllByQuerystring = vi.fn();
  const mockDeleteCertificateAttemptReadOnlyOneByQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createdCertificateInstances = [];
    createdInstallCertificateAttemptInstances = [];
    createdInstalledCertificateInstances = [];
    createdDeleteCertificateAttemptInstances = [];

    mockCertificateRepository = {
      readOnlyOneByQuery: mockCertificateReadOnlyOneByQuery,
      createOrUpdateCertificate: vi.fn(),
    } as any;

    mockInstalledCertificateRepository = {
      readOnlyOneByQuery: mockInstalledCertificateReadOnlyOneByQuery,
    } as any;

    mockInstallCertificateAttemptRepository = {
      readOnlyOneByQuery: mockInstallCertificateAttemptReadOnlyOneByQuery,
    } as any;

    // Defaults to an empty result, i.e. AdditionalRootCertificateCheck is unset/disabled,
    // so existing tests that don't care about M05.FR.10 aren't affected by it.
    mockDeviceModelReadAllByQuerystring.mockResolvedValue([]);
    mockDeviceModelRepository = {
      readAllByQuerystring: mockDeviceModelReadAllByQuerystring,
    } as any;

    mockDeleteCertificateAttemptRepository = {
      readOnlyOneByQuery: mockDeleteCertificateAttemptReadOnlyOneByQuery,
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
      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(mockExistingAttempt);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
      );

      expect(service.getCertificateHash).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(mockInstallCertificateAttemptReadOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
        where: {
          ocppConnectionName,
          certificateType: MOCK_CERT_TYPE_V2G,
          status: null,
        },
        include: [
          {
            model: Certificate,
            where: {
              certificateFileHash: mockHash,
            },
          },
        ],
      });
      expect(createdInstallCertificateAttemptInstances).toHaveLength(0);
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

      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(undefined);
      mockExtractCertificateDetails.mockReturnValue(mockCertDetails);
      mockCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as any);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
      );

      expect(mockExtractCertificateDetails).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(mockCertificateReadOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
        where: { certificateFileHash: mockHash },
      });
      expect(service.createNewCertificate).toHaveBeenCalledWith(
        MOCK_CERTIFICATE,
        mockCertDetails.serialNumber,
        mockCertDetails.issuerName,
        mockCertDetails.organizationName,
        mockCertDetails.commonName,
        mockCertDetails.countryName,
        mockCertDetails.validBefore,
        mockCertDetails.signatureAlgorithm,
      );

      const savedAttempt = createdInstallCertificateAttemptInstances[0];
      expect(savedAttempt).toBeDefined();
      expect(savedAttempt.save).toHaveBeenCalled();
    });

    it('should include requestId when checking for existing pending attempt', async () => {
      const mockExistingAttempt = { id: 1 } as any;
      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(mockExistingAttempt);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
        42,
      );

      expect(mockInstallCertificateAttemptReadOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
        where: {
          ocppConnectionName,
          certificateType: MOCK_CERT_TYPE_V2G,
          status: null,
          requestId: 42,
        },
        include: [
          {
            model: Certificate,
            where: { certificateFileHash: mockHash },
          },
        ],
      });
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

      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(undefined);
      mockExtractCertificateDetails.mockReturnValue(mockCertDetails);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as any);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
        42,
      );

      const savedAttempt = createdInstallCertificateAttemptInstances[0];
      expect(savedAttempt).toBeDefined();
      expect(savedAttempt.requestId).toBe(42);
      expect(savedAttempt.save).toHaveBeenCalled();
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

      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(undefined);
      mockExtractCertificateDetails.mockReturnValue(mockCertDetails);
      mockCertificateReadOnlyOneByQuery.mockResolvedValue(mockExistingCertificate);

      await service.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
      );

      expect(service.createNewCertificate).not.toHaveBeenCalled();

      const savedAttempt = createdInstallCertificateAttemptInstances[0];
      expect(savedAttempt).toBeDefined();
      expect(savedAttempt.certificateId).toBe(99);
      expect(savedAttempt.save).toHaveBeenCalled();
    });

    describe('AdditionalRootCertificateCheck (M05.FR.10)', () => {
      const MOCK_CERT_TYPE_CSMS_ROOT = 'CSMSRootCertificate';
      const previousRootPemBuffer = Buffer.from('previous-root-pem');

      beforeEach(() => {
        // Common setup for tests that don't short-circuit on an existing pending attempt.
        mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(undefined);
        mockExtractCertificateDetails.mockReturnValue({
          serialNumber: 1,
          issuerName: 'Test Issuer',
          organizationName: 'Test Org',
          commonName: 'localhost',
          countryName: 'US',
          validBefore: new Date('2027-02-17'),
          signatureAlgorithm: 'SHA256withECDSA' as any,
        });
        mockCertificateReadOnlyOneByQuery.mockResolvedValue({ id: 1 } as any);
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
        expect(mockInstalledCertificateReadOnlyOneByQuery).not.toHaveBeenCalled();
      });

      it('allows the install when no CSMS root is currently installed (initial install)', async () => {
        mockDeviceModelReadAllByQuerystring.mockResolvedValue([{ value: 'true' }]);
        mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);

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
        mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue({
          $get: vi.fn().mockResolvedValue(undefined),
        } as any);

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
        mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue({
          $get: vi.fn().mockResolvedValue({ certificateFileId: 'root-cert-path' }),
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
        mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue({
          $get: vi.fn().mockResolvedValue({ certificateFileId: 'root-cert-path' }),
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

        expect(createdInstallCertificateAttemptInstances).toHaveLength(1);
      });
    });
  });

  describe('finalizeInstalledCertificate', () => {
    it('should do nothing if no pending install attempt exists', async () => {
      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(undefined);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_REJECTED as any,
      );

      expect(mockInstalledCertificateReadOnlyOneByQuery).not.toHaveBeenCalled();
    });

    it('should update status of pending attempt', async () => {
      const mockAttemptSave = vi.fn().mockResolvedValue(true);
      const mockAttempt = {
        id: 1,
        save: mockAttemptSave,
      } as any;

      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(mockAttempt);
      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_REJECTED as any,
      );

      expect(mockAttempt.status).toBe(MOCK_STATUS_REJECTED);
      expect(mockAttemptSave).toHaveBeenCalled();
    });

    it('should update existing installed certificate if status is Accepted', async () => {
      const mockAttemptSave = vi.fn().mockResolvedValue(true);
      const mockInstalledSave = vi.fn().mockResolvedValue(true);

      const mockAttempt = {
        id: 1,
        certificateId: 100,
        certificateType: MOCK_CERT_TYPE_V2G,
        save: mockAttemptSave,
      } as any;

      const mockInstalledCert = {
        id: 50,
        save: mockInstalledSave,
      } as any;

      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(mockAttempt);
      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(mockInstalledCert);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_ACCEPTED as any,
      );

      expect(mockInstalledCert.certificateId).toBe(100);
      expect(mockInstalledSave).toHaveBeenCalled();
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
        save: vi.fn().mockResolvedValue(true),
        $get: vi.fn().mockResolvedValue(mockCertificate),
      } as any;

      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(mockAttempt);
      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      mockFileStorageGetFile.mockResolvedValue(Buffer.from(MOCK_CERTIFICATE));

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_ACCEPTED as any,
      );

      expect(mockAttempt.$get).toHaveBeenCalledWith('certificate');
      expect(mockFileStorageGetFile).toHaveBeenCalledWith('file123');

      const savedInstalledCert = createdInstalledCertificateInstances[0];
      expect(savedInstalledCert).toBeDefined();
      expect(savedInstalledCert.save).toHaveBeenCalled();
    });

    it('should include requestId in lookup query when provided', async () => {
      const mockAttemptSave = vi.fn().mockResolvedValue(true);
      const mockAttempt = {
        id: 1,
        save: mockAttemptSave,
      } as any;

      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(mockAttempt);
      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);

      await service.finalizeInstalledCertificate(
        tenantId,
        ocppConnectionName,
        MOCK_STATUS_REJECTED as any,
        42,
      );

      expect(mockInstallCertificateAttemptReadOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
        where: {
          ocppConnectionName,
          status: null,
          requestId: 42,
        },
      });
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
        save: vi.fn().mockResolvedValue(true),
        $get: vi.fn().mockResolvedValue(mockCertificate),
      } as any;

      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(mockAttempt);
      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
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
      expect(createdInstalledCertificateInstances).toHaveLength(0);
    });
  });

  describe('createNewCertificate', () => {
    it('should call getCertificateHash and save file', async () => {
      mockFileStorageSaveFile.mockResolvedValue('fileId123');

      await service.createNewCertificate(
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

      const savedCert = createdCertificateInstances[0];
      expect(savedCert.save).toHaveBeenCalled();
    });

    it('should save certificate record with correct values', async () => {
      mockFileStorageSaveFile.mockResolvedValue('fileId123');

      const result = await service.createNewCertificate(
        MOCK_CERTIFICATE,
        123456,
        'Test Issuer',
        'Test Org',
        'localhost',
        'US' as any,
        new Date('2027-02-17'),
        'SHA256withECDSA' as any,
      );

      const savedCert = createdCertificateInstances[0];
      expect(savedCert.serialNumber).toBe(123456);
      expect(savedCert.issuerName).toBe('Test Issuer');
      expect(savedCert.certificateFileHash).toBe(mockHash);
      expect(result).toBe(savedCert);
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
      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      mockCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as Certificate);

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(mockExtractCertificateDetails).toHaveBeenCalledWith(MOCK_CERTIFICATE);
    });

    it('should throw error if certificate already exists with fileId', async () => {
      const mockExistingCert = { id: 99, certificateFileId: 'existingFile' } as any;
      const mockInstalledCert = {
        id: 50,
        $get: vi.fn().mockResolvedValue(mockExistingCert),
      } as any;

      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(mockInstalledCert);

      await expect(
        service.handleUploadExistingCertificate(tenantId, ocppConnectionName, mockUploadRequest),
      ).rejects.toThrow('Cannot upload exiting certificate because it already exists');
    });

    it('should save file and update certificate if fileId is missing', async () => {
      const mockCertSave = vi.fn().mockResolvedValue(true);
      const mockExistingCert = {
        id: 99,
        certificateFileId: undefined,
        save: mockCertSave,
      } as any;
      const mockInstalledCert = {
        id: 50,
        $get: vi.fn().mockResolvedValue(mockExistingCert),
      } as any;

      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(mockInstalledCert);
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
      expect(Certificate.create).toHaveBeenCalledWith(
        expect.objectContaining({ certificateFileId: 'newFileId' }),
      );
    });

    it('should get or create certificate and update installed cert if no cert tied', async () => {
      const mockInstalledSave = vi.fn().mockResolvedValue({ id: 200 });
      const mockInstalledCert = {
        id: 50,
        $get: vi.fn().mockResolvedValue(null),
        save: mockInstalledSave,
      } as any;
      const mockExistingCert = { id: 99 } as any;

      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(mockInstalledCert);
      mockCertificateReadOnlyOneByQuery.mockResolvedValue(mockExistingCert);

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(mockCertificateReadOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
        where: { certificateFileHash: mockHash },
      });
      expect(mockInstalledCert.certificateId).toBe(99);
      expect(mockInstalledSave).toHaveBeenCalled();
    });

    it('should create new certificate if not found when no cert tied', async () => {
      const mockInstalledSave = vi.fn().mockResolvedValue({ id: 200 });
      const mockInstalledCert = {
        id: 50,
        $get: vi.fn().mockResolvedValue(null),
        save: mockInstalledSave,
      } as any;

      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(mockInstalledCert);
      mockCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as Certificate);

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(service.createNewCertificate).toHaveBeenCalled();
      expect(mockInstalledCert.certificateId).toBe(100);
    });

    it('should create new installed certificate if none exists', async () => {
      const mockExistingCert = { id: 99 } as Certificate;

      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      mockCertificateReadOnlyOneByQuery.mockResolvedValue(mockExistingCert);

      const result = await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      const savedInstalledCert = createdInstalledCertificateInstances[0];
      expect(savedInstalledCert).toBeDefined();
      expect(savedInstalledCert.save).toHaveBeenCalled();
      expect(result).toBe(savedInstalledCert);
    });

    it('should create certificate and installed cert if neither exist', async () => {
      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      mockCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      vi.spyOn(service, 'createNewCertificate').mockResolvedValue({ id: 100 } as Certificate);

      await service.handleUploadExistingCertificate(
        tenantId,
        ocppConnectionName,
        mockUploadRequest,
      );

      expect(service.createNewCertificate).toHaveBeenCalledWith(
        MOCK_CERTIFICATE,
        mockCertDetails.serialNumber,
        mockCertDetails.issuerName,
        mockCertDetails.organizationName,
        mockCertDetails.commonName,
        mockCertDetails.countryName,
        mockCertDetails.validBefore,
        mockCertDetails.signatureAlgorithm,
      );

      const savedInstalledCert = createdInstalledCertificateInstances[0];
      expect(savedInstalledCert.save).toHaveBeenCalled();
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
        mockCertificateReadOnlyOneByQuery.mockResolvedValue({
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
        mockCertificateReadOnlyOneByQuery.mockResolvedValue({
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
        expect(mockCertificateReadOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
          where: { certificateFileHash: mockHash },
        });
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
        mockCertificateReadOnlyOneByQuery.mockResolvedValue({ id: 20, signedBy: null });

        await expect(
          service.generateCertificateChain(tenantId, websocketConfig, certRequest),
        ).rejects.toThrow(BadRequestError);
      });

      it('throws BadRequestError if the root record is missing its certificate or private key', async () => {
        mockFileStorageGetFile.mockResolvedValueOnce(Buffer.from('leafPem+subCACertPem'));
        mockParseCertificateChainPem.mockReturnValue(['leafPem', 'subCACertPem']);
        mockCertificateReadOnlyOneByQuery
          .mockResolvedValueOnce({ id: 20, signedBy: 10 })
          .mockResolvedValueOnce({
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
        mockCertificateReadOnlyOneByQuery
          .mockResolvedValueOnce({ id: 20, signedBy: 10 })
          .mockResolvedValueOnce({
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
          mockCertificateReadOnlyOneByQuery.mockResolvedValue({
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
          mockCertificateReadOnlyOneByQuery.mockResolvedValue({
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
          mockCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);

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
          mockCertificateReadOnlyOneByQuery.mockResolvedValue({
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
        mockCertificateReadOnlyOneByQuery.mockResolvedValue({ id: 1, signedBy: 100 });

        const groups = await service.groupServersForGeneration(
          tenantId,
          [configA, configB],
          CertificateGenerationScope.SubCAAndLeaf,
        );

        expect(groups).toEqual([[configA, configB]]);
      });

      it('splits servers into separate groups when their subCAs were signed by different roots', async () => {
        mockCertificateReadOnlyOneByQuery.mockImplementation((_tenantId: number, query: any) =>
          Promise.resolve(
            query.where.certificateFileHash === 'subCA-chain-a.pem'
              ? { id: 1, signedBy: 100 }
              : { id: 2, signedBy: 200 },
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
        mockCertificateReadOnlyOneByQuery.mockResolvedValue({ id: 1, signedBy: null });

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
      mockDeleteCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(null);

      await service.prepareToDeleteCertificate(tenantId, ocppConnectionName, certificateHashData);

      expect(mockDeleteCertificateAttemptReadOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
        where: {
          ocppConnectionName,
          hashAlgorithm: certificateHashData.hashAlgorithm,
          issuerNameHash: certificateHashData.issuerNameHash,
          issuerKeyHash: certificateHashData.issuerKeyHash,
          serialNumber: certificateHashData.serialNumber,
          status: null,
        },
      });
    });

    it('creates an attempt carrying the hash data when none is pending', async () => {
      mockDeleteCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(null);

      await service.prepareToDeleteCertificate(tenantId, ocppConnectionName, certificateHashData);

      expect(createdDeleteCertificateAttemptInstances).toHaveLength(1);
      const created = createdDeleteCertificateAttemptInstances[0];
      expect(created.ocppConnectionName).toBe(ocppConnectionName);
      expect(created.hashAlgorithm).toBe(certificateHashData.hashAlgorithm);
      expect(created.issuerNameHash).toBe(certificateHashData.issuerNameHash);
      expect(created.issuerKeyHash).toBe(certificateHashData.issuerKeyHash);
      expect(created.serialNumber).toBe(certificateHashData.serialNumber);
      expect(created.save).toHaveBeenCalled();
    });

    it('does not create a second attempt when one is already pending', async () => {
      mockDeleteCertificateAttemptReadOnlyOneByQuery.mockResolvedValue({ id: 50 });

      await service.prepareToDeleteCertificate(tenantId, ocppConnectionName, certificateHashData);

      expect(createdDeleteCertificateAttemptInstances).toHaveLength(0);
    });
  });
});
