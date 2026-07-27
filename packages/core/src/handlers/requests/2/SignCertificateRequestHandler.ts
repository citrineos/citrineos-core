// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AsHandlerClass,
  AttributeEnum,
  CertificateSigningUseEnum,
  type CertificateSigningUseEnumType,
  type CertificateUseEnumType,
  ErrorCode,
  EventGroup,
  GenericStatusEnum,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  MessageState,
  OCPP2_1,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OcppError,
  OCPPVersion,
} from '@citrineos/base';
import type { IDeviceModelRepository } from '@dal/interfaces/repositories.js';
import {
  CertificateAuthorityService,
  parseCSRForVerification,
  validatePEMEncodedCSR,
} from '@util/index.js';
import type { InstallCertificateHelperService } from '@modules/Certificates/src/module/installCertificateHelperService.js';
import { Crypto } from '@peculiar/webcrypto';
import * as pkijs from 'pkijs';
import { CertificationRequest } from 'pkijs';
import { type ILogObj, Logger } from 'tslog';

const cryptoEngine = new pkijs.CryptoEngine({
  crypto: new Crypto(),
});
pkijs.setEngine('crypto', cryptoEngine as pkijs.ICryptoEngine);

@AsHandlerClass(OCPP_2_VER_LIST, OCPP_CallAction.SignCertificate, MessageState.Request)
export class SignCertificateRequestHandler extends AbstractHandler {
  protected _certificateAuthorityService: CertificateAuthorityService;
  protected _installCertificateHelperService: InstallCertificateHelperService;
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor({
    ocppSender,
    logger,
    certificateAuthorityService,
    installCertificateHelperService,
    deviceModelRepository,
  }: {
    ocppSender: IOcppSender;
    logger: Logger<ILogObj>;
    certificateAuthorityService: CertificateAuthorityService;
    installCertificateHelperService: InstallCertificateHelperService;
    deviceModelRepository: IDeviceModelRepository;
  }) {
    super({ ocppSender, logger });

    this._certificateAuthorityService = certificateAuthorityService;
    this._installCertificateHelperService = installCertificateHelperService;
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.SignCertificateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Handler for SignCertificateRequest received message:', message, props);
    const tenantId = message.context.tenantId;
    const ocppConnectionName: string = message.context.ocppConnectionName;
    const csrString: string = message.payload.csr.replace(/\n/g, '');
    const certificateType: CertificateSigningUseEnumType | undefined | null =
      message.payload.certificateType;
    let requestId: number | undefined | null;
    if (message.protocol === OCPPVersion.OCPP2_1) {
      const payload21 = message.payload as OCPP2_1.SignCertificateRequest;
      requestId = payload21.requestId;
    }

    // Validate PEM format
    const validationResult = validatePEMEncodedCSR(message.payload.csr);
    if (!validationResult.isValid) {
      this._logger.warn(`Invalid CSR format: ${validationResult.errorMessage}`);
      await this._ocppSender.sendCallErrorWithMessage(
        message,
        new OcppError(
          message.context.correlationId,
          ErrorCode.FormatViolation,
          'Invalid CSR format.',
        ),
      );
      return;
    }

    // TODO OCTT Currently fails the CSMS on test case TC_A_14_CSMS if an invalid csr is rejected
    //  Despite explicitly saying in the protocol "The CSMS may do some checks on the CSR"
    //  So it is necessary to accept before checking the csr. when this is fixed, this line can be removed
    //  And the other sendCallResultWithMessage for SignCertificateResponse can be uncommented
    await this._ocppSender.sendCallResultWithMessage(message, {
      status: GenericStatusEnum.Accepted,
    } as OCPP2_response_types.SignCertificateResponse);

    let certificateChainPem: string;
    try {
      await this._verifySignCertRequest(csrString, tenantId, ocppConnectionName, certificateType);

      certificateChainPem = await this._certificateAuthorityService.getCertificateChain(
        csrString,
        ocppConnectionName,
        certificateType,
      );
    } catch (error) {
      this._logger.error('Sign certificate failed:', error);

      // TODO uncomment after OCTT issue is fixed
      // this._ocppSender.sendCallResultWithMessage(message, {
      //   status: GenericStatusEnumType.Rejected,
      //   statusInfo: {
      //     reasonCode: ErrorCode.GenericError,
      //     additionalInfo: error instanceof Error ? error.message : undefined,
      //   },
      // } as SignCertificateResponse);

      return;
    }

    // TODO uncomment after OCTT issue is fixed
    // this._ocppSender.sendCallResultWithMessage(message, {
    //   status: GenericStatusEnumType.Accepted,
    // } as SignCertificateResponse);

    await this._installCertificateHelperService.prepareToInstallCertificate(
      tenantId,
      ocppConnectionName,
      certificateChainPem,
      certificateType as unknown as CertificateUseEnumType,
      requestId,
    );

    const certSignedRequest = {
      certificateChain: certificateChainPem,
      certificateType: certificateType,
    } as OCPP2_request_types.CertificateSignedRequest;

    if (message.protocol === OCPPVersion.OCPP2_1 && requestId != null) {
      (certSignedRequest as OCPP2_1.CertificateSignedRequest).requestId = requestId;
    }

    await this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol: message.protocol,
      action: OCPP_CallAction.CertificateSigned,
      eventGroup: EventGroup.Certificates,
      payload: certSignedRequest,
    });
  }

  private async _verifySignCertRequest(
    csrString: string,
    tenantId: number,
    ocppConnectionName: string,
    certificateType?: CertificateSigningUseEnumType | null,
  ): Promise<void> {
    // Verify certificate type
    if (
      !certificateType ||
      (certificateType !== CertificateSigningUseEnum.V2GCertificate &&
        certificateType !== CertificateSigningUseEnum.V2G20Certificate &&
        certificateType !== CertificateSigningUseEnum.ChargingStationCertificate)
    ) {
      throw new Error(`Unsupported certificate type: ${certificateType}`);
    }

    // Verify CSR
    const csr: CertificationRequest = parseCSRForVerification(csrString);
    this._logger.info(`Verifying CSR: ${JSON.stringify(csr)}`);

    if (!(await csr.verify())) {
      throw new Error('Verify the signature on this csr using its public key failed');
    }

    if (certificateType === CertificateSigningUseEnum.ChargingStationCertificate) {
      // Verify organization name match the one stored in the device model
      const organizationName = await this._deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId: tenantId,
        ocppConnectionName: ocppConnectionName,
        component_name: 'SecurityCtrlr',
        variable_name: 'OrganizationName',
        type: AttributeEnum.Actual,
      });
      if (!organizationName || organizationName.length < 1) {
        throw new Error('Expected organizationName not found in DB');
      }
      // Find organizationName (its key is '2.5.4.10') attribute in CSR
      const organizationNameAttr = csr.subject.typesAndValues.find(
        (attr) => attr.type === '2.5.4.10',
      );
      if (!organizationNameAttr) {
        throw new Error('organizationName attribute not found in CSR');
      }
      if (organizationName[0].value !== organizationNameAttr.value.valueBlock.value) {
        throw new Error(
          `Expect organizationName ${organizationName[0].value} but get ${organizationNameAttr.value} from the csr`,
        );
      }
    }

    this._logger.info(`Verified SignCertRequest for station ${ocppConnectionName} successfully.`);
  }
}
