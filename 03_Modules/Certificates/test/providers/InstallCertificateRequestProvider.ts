// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1 } from '@citrineos/base';

export const MOCK_CERTIFICATE = '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----';

export function aInstallCertificateRequest(
  override?: Partial<OCPP2_0_1.InstallCertificateRequest>,
): OCPP2_0_1.InstallCertificateRequest {
  return {
    certificateType: OCPP2_0_1.InstallCertificateUseEnumType.V2GRootCertificate,
    certificate: MOCK_CERTIFICATE,
    ...override,
  };
}
