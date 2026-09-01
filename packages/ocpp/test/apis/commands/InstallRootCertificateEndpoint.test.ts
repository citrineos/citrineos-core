// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP2_0_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallRootCertificateEndpoint } from '@/apis/commands/InstallRootCertificateEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';

const URL = '/commands/installRootCertificate';
const A_PEM = '-----BEGIN CERTIFICATE-----\nfrom-file\n-----END CERTIFICATE-----';
const CA_PEM = '-----BEGIN CERTIFICATE-----\nfrom-ca\n-----END CERTIFICATE-----';

function aBody(override: Record<string, unknown> = {}) {
  return {
    ocppConnectionName: 'cs001',
    tenantId: DEFAULT_TENANT_ID,
    certificateType: OCPP2_0_1.InstallCertificateUseEnumType.V2GRootCertificate,
    ...override,
  };
}

describe('InstallRootCertificateEndpoint', () => {
  const { container } = createTestContainer();

  let getFile: ReturnType<typeof vi.fn>;
  let getRootCACertificateFromExternalCA: ReturnType<typeof vi.fn>;
  let sendCall: ReturnType<typeof vi.fn>;
  let readChargingStationByStationId: ReturnType<typeof vi.fn>;
  let mounted: MountedEndpoint;

  beforeEach(async () => {
    vi.clearAllMocks();
    getFile = vi.fn().mockResolvedValue(Buffer.from(A_PEM));
    getRootCACertificateFromExternalCA = vi.fn().mockResolvedValue(CA_PEM);
    sendCall = vi.fn().mockResolvedValue({ success: true, payload: 'queued' });
    readChargingStationByStationId = vi.fn().mockResolvedValue({ protocol: OCPPVersion.OCPP2_0_1 });

    const endpoint = getTestInstance(container, InstallRootCertificateEndpoint, {
      fileStorage: { getFile },
      ocppSender: { sendCall },
      certificateAuthorityService: { getRootCACertificateFromExternalCA },
      locationRepository: { readChargingStationByStationId },
    });
    mounted = await mountEndpoint(endpoint, InstallRootCertificateEndpoint.route);
  });

  const post = (body: Record<string, unknown>) =>
    mounted.server.inject({ method: 'PUT', url: URL, payload: body });

  it('reads the certificate from file storage when a fileId is supplied', async () => {
    const response = await post(aBody({ fileId: 'file-1' }));

    expect(response.statusCode).toBe(200);
    expect(getFile).toHaveBeenCalledWith('file-1');
    expect(getRootCACertificateFromExternalCA).not.toHaveBeenCalled();
    expect(sendCall.mock.calls[0][0].payload).toEqual({
      certificateType: OCPP2_0_1.InstallCertificateUseEnumType.V2GRootCertificate,
      certificate: A_PEM,
    });
  });

  it('falls back to the external CA when no fileId is supplied', async () => {
    await post(aBody());

    expect(getFile).not.toHaveBeenCalled();
    expect(getRootCACertificateFromExternalCA).toHaveBeenCalledWith(
      OCPP2_0_1.InstallCertificateUseEnumType.V2GRootCertificate,
    );
    expect(sendCall.mock.calls[0][0].payload.certificate).toBe(CA_PEM);
  });

  it('sends InstallCertificate to the named station', async () => {
    await post(aBody());

    expect(sendCall).toHaveBeenCalledTimes(1);
    expect(sendCall.mock.calls[0][0]).toMatchObject({
      ocppConnectionName: 'cs001',
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.InstallCertificate,
      eventGroup: EventGroup.Certificates,
    });
  });

  it('sends using the protocol the station is recorded as speaking', async () => {
    readChargingStationByStationId.mockResolvedValue({ protocol: OCPPVersion.OCPP2_1 });

    await post(aBody());

    expect(sendCall.mock.calls[0][0].protocol).toBe(OCPPVersion.OCPP2_1);
  });

  it('refuses a station whose protocol cannot serve the request', async () => {
    readChargingStationByStationId.mockResolvedValue({ protocol: OCPPVersion.OCPP1_6 });

    const response = await post(aBody());

    expect(response.json().success).toBe(false);
    expect(sendCall).not.toHaveBeenCalled();
    expect(getRootCACertificateFromExternalCA).not.toHaveBeenCalled();
  });

  it('refuses a station that has never connected', async () => {
    readChargingStationByStationId.mockResolvedValue(undefined);

    const response = await post(aBody());

    expect(response.json().success).toBe(false);
    expect(sendCall).not.toHaveBeenCalled();
  });

  it('forwards the callback url when supplied', async () => {
    await post(aBody({ callbackUrl: 'http://cb' }));

    expect(sendCall.mock.calls[0][0].callbackUrl).toBe('http://cb');
  });

  it('reports success without claiming the station accepted the certificate', async () => {
    const response = await post(aBody());

    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.payload).toContain('accepted for delivery to cs001');
    expect(body.payload).toContain('asynchronously');
  });

  it('fails when the send was not accepted', async () => {
    sendCall.mockResolvedValue({ success: false, payload: 'no route to station' });

    const response = await post(aBody());

    expect(response.statusCode).toBe(500);
    expect(mounted.loggedErrors).toHaveLength(1);
  });

  it('rejects a body missing the station name', async () => {
    const { ocppConnectionName: _omitted, ...body } = aBody();

    const response = await post(body);

    expect(response.statusCode).toBe(400);
    expect(sendCall).not.toHaveBeenCalled();
  });
});
