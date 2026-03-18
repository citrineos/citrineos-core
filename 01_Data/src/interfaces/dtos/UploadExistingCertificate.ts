// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1 } from '@citrineos/base';

export class UploadExistingCertificate {
  certificate!: string;
  certificateType!: OCPP2_0_1.GetCertificateIdUseEnumType;
  filePath?: string;
}
