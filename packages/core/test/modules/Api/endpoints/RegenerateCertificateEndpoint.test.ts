// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegenerateCertificateEndpoint } from '@modules/Api/src/module/endpoints/RegenerateCertificateEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';

const URL = '/commands/regenerateCertificate';

function anInstalledCertificate(certificate: unknown) {
  return {
    id: 5,
    certificateId: 1,
    $get: vi.fn().mockResolvedValue(certificate),
    save: vi.fn().mockImplementation(async function (this: unknown) {
      return this;
    }),
  };
}

function aCertificateRecord(override: Record<string, unknown> = {}) {
  return {
    id: 1,
    certificateFileId: 'cert-file',
    privateKeyFileId: 'key-file',
    organizationName: 'CitrineOS',
    commonName: 'cs001',
    keyLength: 2048,
    signatureAlgorithm: 'SHA256withRSA',
    countryName: 'US',
    isCA: false,
    pathLen: 0,
    certificateFileHash: 'old-hash',
    ...override,
  };
}

describe('RegenerateCertificateEndpoint', () => {
  const { container } = createTestContainer();

  let readOnlyOneByQuery: ReturnType<typeof vi.fn>;
  let getFile: ReturnType<typeof vi.fn>;
  let saveFile: ReturnType<typeof vi.fn>;
  let getCertificateHash: ReturnType<typeof vi.fn>;
  let mounted: MountedEndpoint;

  beforeEach(async () => {
    vi.clearAllMocks();
    readOnlyOneByQuery = vi.fn();
    getFile = vi.fn().mockResolvedValue(Buffer.from('pem'));
    saveFile = vi.fn().mockResolvedValue('new-file-id');
    getCertificateHash = vi.fn().mockReturnValue('new-hash');

    const endpoint = getTestInstance(container, RegenerateCertificateEndpoint, {
      fileStorage: { getFile, saveFile },
      installedCertificateRepository: { readOnlyOneByQuery },
      installCertificateHelperService: { getCertificateHash },
    });
    mounted = await mountEndpoint(endpoint, RegenerateCertificateEndpoint.route);
  });

  const post = () =>
    mounted.server.inject({
      method: 'POST',
      url: `${URL}?identifier=cs001&tenantId=${DEFAULT_TENANT_ID}`,
      payload: { installedCertificateId: 5, validBefore: '2030-01-01T00:00:00Z' },
    });

  const errorCount = () => mounted.loggedErrors.length;

  it('looks the certificate up scoped to the tenant and station', async () => {
    readOnlyOneByQuery.mockResolvedValue(undefined);

    await post();

    expect(readOnlyOneByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      where: { id: 5, ocppConnectionName: 'cs001' },
    });
  });

  it('fails when the installed certificate does not exist', async () => {
    readOnlyOneByQuery.mockResolvedValue(undefined);

    const response = await post();

    expect(response.statusCode).toBe(500);
    expect(errorCount()).toBe(1);
  });

  it('fails when the installed certificate has no associated certificate', async () => {
    readOnlyOneByQuery.mockResolvedValue(anInstalledCertificate(undefined));

    const response = await post();

    expect(response.statusCode).toBe(500);
    expect(errorCount()).toBe(1);
  });

  it('fails when the certificate has no certificate file', async () => {
    readOnlyOneByQuery.mockResolvedValue(
      anInstalledCertificate(aCertificateRecord({ certificateFileId: undefined })),
    );

    const response = await post();

    expect(response.statusCode).toBe(500);
    expect(getFile).not.toHaveBeenCalled();
  });

  it('fails when the certificate has no private key file', async () => {
    readOnlyOneByQuery.mockResolvedValue(
      anInstalledCertificate(aCertificateRecord({ privateKeyFileId: undefined })),
    );

    const response = await post();

    expect(response.statusCode).toBe(500);
    expect(getFile).not.toHaveBeenCalled();
  });

  it('fails when either stored file is missing from storage', async () => {
    readOnlyOneByQuery.mockResolvedValue(anInstalledCertificate(aCertificateRecord()));
    getFile.mockResolvedValueOnce(Buffer.from('cert')).mockResolvedValueOnce(undefined);

    const response = await post();

    expect(response.statusCode).toBe(500);
    expect(getFile).toHaveBeenCalledTimes(2);
  });

  it('rejects a body without an installedCertificateId', async () => {
    const response = await mounted.server.inject({
      method: 'POST',
      url: `${URL}?identifier=cs001&tenantId=${DEFAULT_TENANT_ID}`,
      payload: { validBefore: '2030-01-01T00:00:00Z' },
    });

    expect(response.statusCode).toBe(400);
    expect(readOnlyOneByQuery).not.toHaveBeenCalled();
  });

  it('rejects a request without an identifier', async () => {
    const response = await mounted.server.inject({
      method: 'POST',
      url: URL,
      payload: { installedCertificateId: 5, validBefore: '2030-01-01T00:00:00Z' },
    });

    expect(response.statusCode).toBe(400);
    expect(readOnlyOneByQuery).not.toHaveBeenCalled();
  });
});
