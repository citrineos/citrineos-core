// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1 } from '@citrineos/base';

export function aDeleteCertificateRequest(
  override?: Partial<OCPP2_0_1.DeleteCertificateRequest>,
): OCPP2_0_1.DeleteCertificateRequest {
  return {
    certificateHashData: {
      hashAlgorithm: OCPP2_0_1.HashAlgorithmEnumType.SHA256,
      issuerNameHash: 'issuerHash123',
      issuerKeyHash: 'keyHash456',
      serialNumber: '123456789',
    },
    ...override,
  };
}
