// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1 } from '@citrineos/types';
import type { UploadExistingCertificate } from '@citrineos/core';
import { MOCK_CERTIFICATE } from '../../Certificates/providers/InstallCertificateRequestProvider.js';

export function aUploadExistingCertificate(
  override?: Partial<UploadExistingCertificate>,
): UploadExistingCertificate {
  return {
    certificateType: OCPP2_0_1.GetCertificateIdUseEnumType.V2GRootCertificate,
    certificate: MOCK_CERTIFICATE,
    ...override,
  };
}
