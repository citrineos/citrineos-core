// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadExistingCertificateEndpoint } from '@/apis/endpoints/UploadExistingCertificateEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';
import { aUploadExistingCertificate } from '../../providers/UploadExistingCertificateProvider.js';

const URL = '/commands/uploadExistingCertificate';

describe('UploadExistingCertificateEndpoint', () => {
  const { container } = createTestContainer();
  const uploadRequest = aUploadExistingCertificate();

  let handleUploadExistingCertificate: ReturnType<typeof vi.fn>;
  let mounted: MountedEndpoint;

  beforeEach(async () => {
    vi.clearAllMocks();
    handleUploadExistingCertificate = vi.fn().mockImplementation(async () => ({ id: 100 }));

    const endpoint = getTestInstance(container, UploadExistingCertificateEndpoint, {
      installCertificateHelperService: { handleUploadExistingCertificate },
    });
    mounted = await mountEndpoint(endpoint, UploadExistingCertificateEndpoint.route);
  });

  it('is registered as a POST under the commands prefix', () => {
    expect(UploadExistingCertificateEndpoint.route.path).toBe('/uploadExistingCertificate');
    expect(UploadExistingCertificateEndpoint.route.method).toBe('POST');
  });

  it('delegates a single identifier to the helper service', async () => {
    const response = await mounted.server.inject({
      method: 'POST',
      url: `${URL}?identifier=cs001&tenantId=${DEFAULT_TENANT_ID}`,
      payload: uploadRequest,
    });

    expect(response.statusCode).toBe(200);
    expect(handleUploadExistingCertificate).toHaveBeenCalledTimes(1);
    expect(handleUploadExistingCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      'cs001',
      expect.objectContaining({ certificateType: uploadRequest.certificateType }),
      undefined,
    );
  });

  it('returns the installed certificate wrapped in an array', async () => {
    const response = await mounted.server.inject({
      method: 'POST',
      url: `${URL}?identifier=cs001&tenantId=${DEFAULT_TENANT_ID}`,
      payload: uploadRequest,
    });

    expect(response.json()).toEqual([{ id: 100 }]);
  });

  it('calls the helper service once per identifier when a list is supplied', async () => {
    handleUploadExistingCertificate
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 })
      .mockResolvedValueOnce({ id: 3 });

    const response = await mounted.server.inject({
      method: 'POST',
      url: `${URL}?identifier=cs001&identifier=cs002&identifier=cs003&tenantId=${DEFAULT_TENANT_ID}`,
      payload: uploadRequest,
    });

    expect(handleUploadExistingCertificate).toHaveBeenCalledTimes(3);
    expect(handleUploadExistingCertificate.mock.calls.map((call: unknown[]) => call[1])).toEqual([
      'cs001',
      'cs002',
      'cs003',
    ]);
    expect(response.json()).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('falls back to the default tenant when tenantId is omitted', async () => {
    const response = await mounted.server.inject({
      method: 'POST',
      url: `${URL}?identifier=cs001`,
      payload: uploadRequest,
    });

    expect(response.statusCode).toBe(200);
    expect(handleUploadExistingCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      'cs001',
      expect.anything(),
      undefined,
    );
  });

  it('passes filePath through to the helper service when provided', async () => {
    await mounted.server.inject({
      method: 'POST',
      url: `${URL}?identifier=cs001&tenantId=${DEFAULT_TENANT_ID}`,
      payload: aUploadExistingCertificate({ filePath: '/certs/existing.pem' }),
    });

    expect(handleUploadExistingCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      'cs001',
      expect.objectContaining({ filePath: '/certs/existing.pem' }),
      '/certs/existing.pem',
    );
  });

  it('rejects a request with no identifier', async () => {
    const response = await mounted.server.inject({
      method: 'POST',
      url: URL,
      payload: uploadRequest,
    });

    expect(response.statusCode).toBe(400);
    expect(handleUploadExistingCertificate).not.toHaveBeenCalled();
  });

  it('surfaces a helper service failure as a 500 and logs it', async () => {
    handleUploadExistingCertificate.mockRejectedValue(new Error('upload exploded'));

    const response = await mounted.server.inject({
      method: 'POST',
      url: `${URL}?identifier=cs001&tenantId=${DEFAULT_TENANT_ID}`,
      payload: uploadRequest,
    });

    expect(response.statusCode).toBe(500);
    expect(mounted.loggedErrors).toHaveLength(1);
  });
});
