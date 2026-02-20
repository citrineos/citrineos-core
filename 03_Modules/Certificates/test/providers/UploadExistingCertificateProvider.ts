// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1 } from '@citrineos/base';
import { UploadExistingCertificate } from '@citrineos/data';
import { MOCK_CERTIFICATE } from './InstallCertificateRequestProvider';

export function aUploadExistingCertificate(
  override?: Partial<UploadExistingCertificate>,
): UploadExistingCertificate {
  return {
    certificateType: OCPP2_0_1.GetCertificateIdUseEnumType.V2GRootCertificate,
    certificate: MOCK_CERTIFICATE,
    ...override,
  };
}
