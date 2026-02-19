// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { aSystemConfig } from '../providers/SystemConfig';
import { InstalledCertificate } from '@citrineos/data';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CertificatesDataApi, CertificatesModule } from '../../src';
import { aUploadExistingCertificate } from '../providers/UploadExistingCertificateProvider';
import { mockFastifyInstance, mockFileStorage } from '../../vitest.setup';
import { MOCK_CHARGING_STATION_ID } from '../providers/ChargingStation';

// Mock the decorator metadata before importing the class
vi.mock('reflect-metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('reflect-metadata')>();
  return {
    ...actual,
  };
});

// Prevent decorator execution in tests
vi.spyOn(Reflect, 'getMetadata').mockReturnValue([]);

const mockHandleUploadExistingCertificate = vi.fn();
let createdInstalledCertificateInstances: any[] = [];

vi.mock('@citrineos/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@citrineos/data')>();

  class MockInstalledCertificate {
    id?: number;
    save = vi.fn().mockResolvedValue(this);

    constructor() {
      createdInstalledCertificateInstances.push(this);
    }
  }

  return {
    ...actual,
    InstalledCertificate: MockInstalledCertificate,
    UploadExistingCertificateSchema: actual.UploadExistingCertificateSchema,
    RegenerateInstalledCertificateSchema: actual.RegenerateInstalledCertificateSchema,
  };
});

describe('CertificatesDataApi', () => {
  let dataApi: CertificatesDataApi;
  let mockCertificatesModule: CertificatesModule;

  const mockUploadRequest = aUploadExistingCertificate();

  beforeEach(() => {
    vi.clearAllMocks();
    createdInstalledCertificateInstances = [];

    mockCertificatesModule = {
      config: aSystemConfig(),
      installCertificateHelperService: {
        handleUploadExistingCertificate: mockHandleUploadExistingCertificate,
      },
    } as any;

    dataApi = new CertificatesDataApi(
      mockCertificatesModule,
      mockFastifyInstance,
      mockFileStorage,
      [],
    );
  });

  describe('uploadExistingCertificate', () => {
    it('should call handleUploadExistingCertificate for single identifier', async () => {
      const mockInstalledCert = { id: 100 } as InstalledCertificate;
      mockHandleUploadExistingCertificate.mockResolvedValue(mockInstalledCert);

      const request = {
        body: mockUploadRequest,
        query: {
          identifier: MOCK_CHARGING_STATION_ID,
          tenantId: DEFAULT_TENANT_ID,
        },
      } as any;

      const result = await dataApi.uploadExistingCertificate(request);

      expect(mockHandleUploadExistingCertificate).toHaveBeenCalledTimes(1);
      expect(mockHandleUploadExistingCertificate).toHaveBeenCalledWith(
        1,
        MOCK_CHARGING_STATION_ID,
        mockUploadRequest,
        undefined,
      );
      expect(result).toEqual([mockInstalledCert]);
    });

    it('should use DEFAULT_TENANT_ID when tenantId is not provided', async () => {
      const mockInstalledCert = { id: 100 } as InstalledCertificate;
      mockHandleUploadExistingCertificate.mockResolvedValue(mockInstalledCert);

      const request = {
        body: mockUploadRequest,
        query: {
          identifier: MOCK_CHARGING_STATION_ID,
        },
      } as any;

      await dataApi.uploadExistingCertificate(request);

      expect(mockHandleUploadExistingCertificate).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        MOCK_CHARGING_STATION_ID,
        mockUploadRequest,
        undefined,
      );
    });

    it('should call handleUploadExistingCertificate for each identifier in array', async () => {
      const mockInstalledCert1 = { id: 100 } as InstalledCertificate;
      const mockInstalledCert2 = { id: 101 } as InstalledCertificate;
      const mockInstalledCert3 = { id: 102 } as InstalledCertificate;

      mockHandleUploadExistingCertificate
        .mockResolvedValueOnce(mockInstalledCert1)
        .mockResolvedValueOnce(mockInstalledCert2)
        .mockResolvedValueOnce(mockInstalledCert3);

      const request = {
        body: mockUploadRequest,
        query: {
          identifier: [MOCK_CHARGING_STATION_ID, 'cp002', 'cp003'],
          tenantId: DEFAULT_TENANT_ID,
        },
      } as any;

      const result = await dataApi.uploadExistingCertificate(request);

      expect(mockHandleUploadExistingCertificate).toHaveBeenCalledTimes(3);
      expect(mockHandleUploadExistingCertificate).toHaveBeenNthCalledWith(
        1,
        1,
        MOCK_CHARGING_STATION_ID,
        mockUploadRequest,
        undefined,
      );
      expect(mockHandleUploadExistingCertificate).toHaveBeenNthCalledWith(
        2,
        1,
        'cp002',
        mockUploadRequest,
        undefined,
      );
      expect(mockHandleUploadExistingCertificate).toHaveBeenNthCalledWith(
        3,
        1,
        'cp003',
        mockUploadRequest,
        undefined,
      );
      expect(result).toEqual([mockInstalledCert1, mockInstalledCert2, mockInstalledCert3]);
    });

    it('should pass filePath to handleUploadExistingCertificate when provided', async () => {
      const mockInstalledCert = { id: 100 } as InstalledCertificate;
      mockHandleUploadExistingCertificate.mockResolvedValue(mockInstalledCert);

      const requestWithFilePath = {
        body: {
          ...mockUploadRequest,
          filePath: '/custom/path',
        },
        query: {
          identifier: MOCK_CHARGING_STATION_ID,
          tenantId: DEFAULT_TENANT_ID,
        },
      } as any;

      await dataApi.uploadExistingCertificate(requestWithFilePath);

      expect(mockHandleUploadExistingCertificate).toHaveBeenCalledWith(
        1,
        MOCK_CHARGING_STATION_ID,
        requestWithFilePath.body,
        '/custom/path',
      );
    });

    it('should handle Promise.all correctly for array of identifiers', async () => {
      const mockInstalledCert1 = { id: 100 } as InstalledCertificate;
      const mockInstalledCert2 = { id: 101 } as InstalledCertificate;

      mockHandleUploadExistingCertificate
        .mockResolvedValueOnce(mockInstalledCert1)
        .mockResolvedValueOnce(mockInstalledCert2);

      const request = {
        body: mockUploadRequest,
        query: {
          identifier: [MOCK_CHARGING_STATION_ID, 'cp002'],
          tenantId: DEFAULT_TENANT_ID,
        },
      } as any;

      const result = await dataApi.uploadExistingCertificate(request);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(mockInstalledCert1);
      expect(result[1]).toBe(mockInstalledCert2);
    });
  });
});
