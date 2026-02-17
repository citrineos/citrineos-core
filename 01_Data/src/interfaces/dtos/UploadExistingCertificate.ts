import { OCPP2_0_1 } from '@citrineos/base';

export class UploadExistingCertificate {
  certificate!: string;
  certificateType!: OCPP2_0_1.GetCertificateIdUseEnumType;
  filePath?: string;
}
