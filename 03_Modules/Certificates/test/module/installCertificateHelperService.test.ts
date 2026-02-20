// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockFileStorage,
  mockFileStorageGetFile,
  mockFileStorageSaveFile,
  mockLogger,
} from '../../vitest.setup';
import {
  Certificate,
  type ICertificateRepository,
  type IDeleteCertificateAttemptRepository,
  type IInstallCertificateAttemptRepository,
  type IInstalledCertificateRepository,
} from '@citrineos/data';
import { type CertificateAuthorityService, WebsocketNetworkConnection } from '@citrineos/util';
import { InstallCertificateHelperService } from '../../src/module/installCertificateHelperService';
import { MOCK_CERTIFICATE } from '../providers/InstallCertificateRequestProvider';

// Define constants BEFORE mocks to avoid hoisting issues
const { MOCK_CERT_TYPE_V2G, MOCK_STATUS_REJECTED, MOCK_STATUS_ACCEPTED } = vi.hoisted(() => ({
  MOCK_CERT_TYPE_V2G: 'V2GRootCertificate',
  MOCK_STATUS_REJECTED: 'Rejected',
  MOCK_STATUS_ACCEPTED: 'Accepted',
}));

const mockExtractCertificateDetails = vi.hoisted(() => vi.fn());

let createdCertificateInstances: any[] = [];
let createdInstallCertificateAttemptInstances: any[] = [];
let createdInstalledCertificateInstances: any[] = [];

vi.mock('@citrineos/util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@citrineos/util')>();
  return {
    ...actual,
    extractCertificateDetails: mockExtractCertificateDetails,
  };
});

vi.mock('@citrineos/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@citrineos/data')>();

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
  }

  class MockInstallCertificateAttempt {
    id?: number;
    stationId?: string;
    certificateType?: string;
    certificateId?: number;
    status?: string;
    save = vi.fn().mockResolvedValue(this);

    constructor() {
      createdInstallCertificateAttemptInstances.push(this);
    }
  }

  class MockInstalledCertificate {
    id?: number;
    stationId?: string;
    certificateId?: number;
    certificateType?: string;
    save = vi.fn().mockResolvedValue(this);

    constructor() {
      createdInstalledCertificateInstances.push(this);
    }
  }

  return {
    ...actual,
    Certificate: MockCertificate,
    InstallCertificateAttempt: MockInstallCertificateAttempt,
    InstalledCertificate: MockInstalledCertificate,
  };
});

describe('InstallCertificateHelperService', () => {
  let service: InstallCertificateHelperService;
  let mockCertificateRepository: ICertificateRepository;
  let mockInstalledCertificateRepository: IInstalledCertificateRepository;
  let mockInstallCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  let mockDeleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  let mockCertificateAuthorityService: CertificateAuthorityService;
  let mockNetworkConnection: WebsocketNetworkConnection;

  const mockHash = 'abc123hash';
  const tenantId = 1;
  const stationId = 'cp001';

  const mockCertificateReadOnlyOneByQuery = vi.fn();
  const mockInstalledCertificateReadOnlyOneByQuery = vi.fn();
  const mockInstallCertificateAttemptReadOnlyOneByQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createdCertificateInstances = [];
    createdInstallCertificateAttemptInstances = [];
    createdInstalledCertificateInstances = [];

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

    mockDeleteCertificateAttemptRepository = {} as any;
    mockCertificateAuthorityService = {} as any;
    mockNetworkConnection = {} as any;

    service = new InstallCertificateHelperService(
      mockCertificateRepository,
      mockInstalledCertificateRepository,
      mockInstallCertificateAttemptRepository,
      mockDeleteCertificateAttemptRepository,
      mockCertificateAuthorityService,
      mockNetworkConnection,
      mockFileStorage,
      mockLogger,
    );

    vi.spyOn(service, 'getCertificateHash').mockReturnValue(mockHash);
  });

  describe('prepareToInstallCertificate', () => {
    it('should not create new install certificate attempt if existing pending attempt exists', async () => {
      const mockExistingAttempt = { id: 1 } as any;
      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(mockExistingAttempt);

      await service.prepareToInstallCertificate(
        tenantId,
        stationId,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
      );

      expect(service.getCertificateHash).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(mockInstallCertificateAttemptReadOnlyOneByQuery).toHaveBeenCalledWith(tenantId, {
        where: {
          stationId,
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
        stationId,
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
        stationId,
        MOCK_CERTIFICATE,
        MOCK_CERT_TYPE_V2G as any,
      );

      expect(service.createNewCertificate).not.toHaveBeenCalled();

      const savedAttempt = createdInstallCertificateAttemptInstances[0];
      expect(savedAttempt).toBeDefined();
      expect(savedAttempt.certificateId).toBe(99);
      expect(savedAttempt.save).toHaveBeenCalled();
    });
  });

  describe('finalizeInstalledCertificate', () => {
    it('should do nothing if no pending install attempt exists', async () => {
      mockInstallCertificateAttemptReadOnlyOneByQuery.mockResolvedValue(undefined);

      await service.finalizeInstalledCertificate(tenantId, stationId, MOCK_STATUS_REJECTED as any);

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

      await service.finalizeInstalledCertificate(tenantId, stationId, MOCK_STATUS_REJECTED as any);

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

      await service.finalizeInstalledCertificate(tenantId, stationId, MOCK_STATUS_ACCEPTED as any);

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

      await service.finalizeInstalledCertificate(tenantId, stationId, MOCK_STATUS_ACCEPTED as any);

      expect(mockAttempt.$get).toHaveBeenCalledWith('certificate');
      expect(mockFileStorageGetFile).toHaveBeenCalledWith('file123');

      const savedInstalledCert = createdInstalledCertificateInstances[0];
      expect(savedInstalledCert).toBeDefined();
      expect(savedInstalledCert.save).toHaveBeenCalled();
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

      await service.finalizeInstalledCertificate(tenantId, stationId, MOCK_STATUS_ACCEPTED as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
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

      await service.handleUploadExistingCertificate(tenantId, stationId, mockUploadRequest);

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
        service.handleUploadExistingCertificate(tenantId, stationId, mockUploadRequest),
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
        stationId,
        mockUploadRequest,
        '/custom/path',
      );

      expect(mockFileStorageSaveFile).toHaveBeenCalledWith(
        `Existing_Key_${mockCertDetails.serialNumber}.pem`,
        Buffer.from(MOCK_CERTIFICATE),
        '/custom/path',
      );
      expect(mockExistingCert.certificateFileId).toBe('newFileId');
      expect(mockCertSave).toHaveBeenCalled();
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

      await service.handleUploadExistingCertificate(tenantId, stationId, mockUploadRequest);

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

      await service.handleUploadExistingCertificate(tenantId, stationId, mockUploadRequest);

      expect(service.createNewCertificate).toHaveBeenCalled();
      expect(mockInstalledCert.certificateId).toBe(100);
    });

    it('should create new installed certificate if none exists', async () => {
      const mockExistingCert = { id: 99 } as Certificate;

      mockInstalledCertificateReadOnlyOneByQuery.mockResolvedValue(undefined);
      mockCertificateReadOnlyOneByQuery.mockResolvedValue(mockExistingCert);

      const result = await service.handleUploadExistingCertificate(
        tenantId,
        stationId,
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

      await service.handleUploadExistingCertificate(tenantId, stationId, mockUploadRequest);

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
});
