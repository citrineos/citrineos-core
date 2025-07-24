// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  CallAction,
  ErrorCode,
  EventGroup,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  OCPP2_0_1_Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  SystemConfig,
  BootstrapConfig,
} from '@citrineos/base';
import { Op } from 'sequelize';
import {
  Boot,
  ICertificateRepository,
  IDeviceModelRepository,
  IInstalledCertificateRepository,
  ILocationRepository,
  InstalledCertificate,
  sequelize,
} from '@citrineos/data';
import {
  CertificateAuthorityService,
  parseCSRForVerification,
  RabbitMqReceiver,
  RabbitMqSender,
  sendOCSPRequest,
} from '@citrineos/util';
import { ILogObj, Logger } from 'tslog';
import jsrsasign from 'jsrsasign';
import * as pkijs from 'pkijs';
import { CertificationRequest } from 'pkijs';
import { Crypto } from '@peculiar/webcrypto';

const cryptoEngine = new pkijs.CryptoEngine({
  crypto: new Crypto(),
});
pkijs.setEngine('crypto', cryptoEngine as pkijs.ICryptoEngine);

/**
 * Component that handles provisioning related messages.
 */
export class CertificatesModule extends AbstractModule {
  /**
   * Fields
   */

  _requests: CallAction[] = [];

  _responses: CallAction[] = [];

  protected _deviceModelRepository: IDeviceModelRepository;
  protected _certificateRepository: ICertificateRepository;
  protected _installedCertificateRepository: IInstalledCertificateRepository;
  protected _locationRepository: ILocationRepository;
  protected _certificateAuthorityService: CertificateAuthorityService;

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link CertificatesModule}.
   *
   * @param {BootstrapConfig & SystemConfig} config - The `config` contains configuration settings for the module.
   *
   * @param {ICache} [cache] - The cache instance which is shared among the modules & Central System to pass information such as blacklisted actions or boot status.
   *
   * @param {IMessageSender} [sender] - The `sender` parameter is an optional parameter that represents an instance of the {@link IMessageSender} interface.
   * It is used to send messages from the central system to external systems or devices. If no `sender` is provided, a default {@link RabbitMqSender} instance is created and used.
   *
   * @param {IMessageHandler} [handler] - The `handler` parameter is an optional parameter that represents an instance of the {@link IMessageHandler} interface.
   * It is used to handle incoming messages and dispatch them to the appropriate methods or functions. If no `handler` is provided, a default {@link RabbitMqReceiver} instance is created and used.
   *
   * @param {Logger<ILogObj>} [logger] - The `logger` parameter is an optional parameter that represents an instance of {@link Logger<ILogObj>}.
   * It is used to propagate system wide logger settings and will serve as the parent logger for any sub-component logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.deviceModelRepository} instance is created and used.
   *
   * @param {ICertificateRepository} [certificateRepository] - An optional parameter of type {@link ICertificateRepository} which
   * represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.certificateRepository} instance is created and used.
   *
   * @param {ILocationRepository} [locationRepository] - An optional parameter of type {@link ILocationRepository} which
   * represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.locationRepository} instance is created and used.
   *
   * @param {CertificateAuthorityService} [certificateAuthorityService] - An optional parameter of
   * type {@link CertificateAuthorityService} which handles certificate authority operations.
   */
  constructor(
    config: BootstrapConfig & SystemConfig,
    cache: ICache,
    sender: IMessageSender,
    handler: IMessageHandler,
    logger?: Logger<ILogObj>,
    deviceModelRepository?: IDeviceModelRepository,
    certificateRepository?: ICertificateRepository,
    locationRepository?: ILocationRepository,
    certificateAuthorityService?: CertificateAuthorityService,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.Certificates,
      logger,
    );

    this._requests = config.modules.certificates?.requests ?? [];
    this._responses = config.modules.certificates?.responses ?? [];

    this._deviceModelRepository =
      deviceModelRepository || new sequelize.SequelizeDeviceModelRepository(config, logger);
    this._certificateRepository =
      certificateRepository || new sequelize.SequelizeCertificateRepository(config, logger);
    this._installedCertificateRepository = new sequelize.SequelizeInstalledCertificateRepository(
      config,
      logger,
    );
    this._locationRepository =
      locationRepository || new sequelize.SequelizeLocationRepository(config, logger);

    this._certificateAuthorityService =
      certificateAuthorityService || new CertificateAuthorityService(config, this._logger);
  }

  get certificateAuthorityService(): CertificateAuthorityService {
    return this._certificateAuthorityService;
  }

  get certificateRepository(): ICertificateRepository {
    return this._certificateRepository;
  }

  /**
   * Handle requests
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.Get15118EVCertificate)
  protected async _handleGet15118EVCertificate(
    message: IMessage<OCPP2_0_1.Get15118EVCertificateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Get15118EVCertificate received:', message, props);
    const request: OCPP2_0_1.Get15118EVCertificateRequest = message.payload;

    try {
      const exiResponse = await this._certificateAuthorityService.getSignedContractData(
        request.iso15118SchemaVersion,
        request.exiRequest,
      );
      await this.sendCallResultWithMessage(message, {
        status: OCPP2_0_1.Iso15118EVCertificateStatusEnumType.Accepted,
        exiResponse: exiResponse,
      } as OCPP2_0_1.Get15118EVCertificateResponse);
    } catch (error) {
      await this.sendCallResultWithMessage(message, {
        status: OCPP2_0_1.Iso15118EVCertificateStatusEnumType.Failed,
        statusInfo: {
          reasonCode: ErrorCode.GenericError,
          additionalInfo: error instanceof Error ? error.message : undefined,
        },
        exiResponse: '',
      } as OCPP2_0_1.Get15118EVCertificateResponse);
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetCertificateStatus)
  protected async _handleGetCertificateStatus(
    message: IMessage<OCPP2_0_1.GetCertificateStatusRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetCertificateStatusRequest received:', message, props);
    const reqData = message.payload.ocspRequestData;
    try {
      const ocspRequest = new jsrsasign.KJUR.asn1.ocsp.Request({
        alg: reqData.hashAlgorithm,
        keyhash: reqData.issuerKeyHash,
        namehash: reqData.issuerNameHash,
        serial: reqData.serialNumber,
      });
      const ocspResponse = await sendOCSPRequest(ocspRequest, reqData.responderURL);
      await this.sendCallResultWithMessage(message, {
        status: OCPP2_0_1.GetCertificateStatusEnumType.Accepted,
        ocspResponse: ocspResponse,
      } as OCPP2_0_1.GetCertificateStatusResponse);
    } catch (error) {
      this._logger.error(`GetCertificateStatus failed: ${error}`);
      await this.sendCallResultWithMessage(message, {
        status: OCPP2_0_1.GetCertificateStatusEnumType.Failed,
        statusInfo: { reasonCode: ErrorCode.GenericError },
      } as OCPP2_0_1.GetCertificateStatusResponse);
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SignCertificate)
  protected async _handleSignCertificate(
    message: IMessage<OCPP2_0_1.SignCertificateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Sign certificate request received:', message, props);
    const stationId: string = message.context.stationId;
    const csrString: string = message.payload.csr.replace(/\n/g, '');
    const certificateType: OCPP2_0_1.CertificateSigningUseEnumType | undefined | null =
      message.payload.certificateType;

    // TODO OCTT Currently fails the CSMS on test case TC_A_14_CSMS if an invalid csr is rejected
    //  Despite explicitly saying in the protocol "The CSMS may do some checks on the CSR"
    //  So it is necessary to accept before checking the csr. when this is fixed, this line can be removed
    //  And the other sendCallResultWithMessage for SignCertificateResponse can be uncommented
    await this.sendCallResultWithMessage(message, {
      status: OCPP2_0_1.GenericStatusEnumType.Accepted,
    } as OCPP2_0_1.SignCertificateResponse);

    let certificateChainPem: string;
    try {
      await this._verifySignCertRequest(
        csrString,
        message.context.tenantId,
        stationId,
        certificateType,
      );

      certificateChainPem = await this._certificateAuthorityService.getCertificateChain(
        csrString,
        stationId,
        certificateType,
      );
    } catch (error) {
      this._logger.error('Sign certificate failed:', error);

      // TODO uncomment after OCTT issue is fixed
      // this.sendCallResultWithMessage(message, {
      //   status: GenericStatusEnumType.Rejected,
      //   statusInfo: {
      //     reasonCode: ErrorCode.GenericError,
      //     additionalInfo: error instanceof Error ? error.message : undefined,
      //   },
      // } as SignCertificateResponse);

      return;
    }

    // TODO uncomment after OCTT issue is fixed
    // this.sendCallResultWithMessage(message, {
    //   status: GenericStatusEnumType.Accepted,
    // } as SignCertificateResponse);

    await this.sendCall(
      stationId,
      message.context.tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.CertificateSigned,
      {
        certificateChain: certificateChainPem,
        certificateType: certificateType,
      } as OCPP2_0_1.CertificateSignedRequest,
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.CertificateSigned)
  protected _handleCertificateSigned(
    message: IMessage<OCPP2_0_1.CertificateSignedResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('CertificateSigned received:', message, props);
    // TODO: If rejected, retry and/or send to callbackUrl if originally part of a triggered refresh
    // TODO: If accepted, revoke old certificate
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.DeleteCertificate)
  protected async _handleDeleteCertificate(
    message: IMessage<OCPP2_0_1.DeleteCertificateResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('DeleteCertificate received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetInstalledCertificateIds)
  protected async _handleGetInstalledCertificateIds(
    message: IMessage<OCPP2_0_1.GetInstalledCertificateIdsResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetInstalledCertificateIds received:', message, props);
    const certificateHashDataList: OCPP2_0_1.CertificateHashDataChainType[] =
      message.payload.certificateHashDataChain!;
    // persist installed certificate information
    if (certificateHashDataList && certificateHashDataList.length > 0) {
      // delete previous hashes for station
      await this.deleteExistingMatchingCertificateHashes(
        message.context.tenantId,
        message.context.stationId,
        certificateHashDataList,
      );
      // save new hashes
      const records = certificateHashDataList.map(
        (certificateHashDataWrap: OCPP2_0_1.CertificateHashDataChainType) => {
          const certificateHashData = certificateHashDataWrap.certificateHashData;
          const certificateType = certificateHashDataWrap.certificateType;
          return {
            tenantId: message.context.tenantId,
            stationId: message.context.stationId,
            hashAlgorithm: certificateHashData.hashAlgorithm,
            issuerNameHash: certificateHashData.issuerNameHash,
            issuerKeyHash: certificateHashData.issuerKeyHash,
            serialNumber: certificateHashData.serialNumber,
            certificateType: certificateType,
          } as InstalledCertificate;
        },
      );
      this._logger.info('Attempting to save', records);
      const response = await this._installedCertificateRepository.bulkCreate(
        message.context.tenantId,
        records,
        OCPP2_0_1_Namespace.InstalledCertificate,
      );
      if (response.length === records.length) {
        this._logger.info(
          'Successfully updated installed certificate information for station',
          message.context.stationId,
        );
      }
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.InstallCertificate)
  protected async _handleInstallCertificate(
    message: IMessage<OCPP2_0_1.InstallCertificateResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('InstallCertificate received:', message, props);
  }

  private async _verifySignCertRequest(
    csrString: string,
    tenantId: number,
    stationId: string,
    certificateType?: OCPP2_0_1.CertificateSigningUseEnumType | null,
  ): Promise<void> {
    // Verify certificate type
    if (
      !certificateType ||
      (certificateType !== OCPP2_0_1.CertificateSigningUseEnumType.V2GCertificate &&
        certificateType !== OCPP2_0_1.CertificateSigningUseEnumType.ChargingStationCertificate)
    ) {
      throw new Error(`Unsupported certificate type: ${certificateType}`);
    }

    // Verify CSR
    const csr: CertificationRequest = parseCSRForVerification(csrString);
    this._logger.info(`Verifying CSR: ${JSON.stringify(csr)}`);

    if (!(await csr.verify())) {
      throw new Error('Verify the signature on this csr using its public key failed');
    }

    if (certificateType === OCPP2_0_1.CertificateSigningUseEnumType.ChargingStationCertificate) {
      // Verify organization name match the one stored in the device model
      const organizationName = await this._deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId: tenantId,
        stationId: stationId,
        component_name: 'SecurityCtrlr',
        variable_name: 'OrganizationName',
        type: OCPP2_0_1.AttributeEnumType.Actual,
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

    this._logger.info(`Verified SignCertRequest for station ${stationId} successfully.`);
  }

  private async deleteExistingMatchingCertificateHashes(
    tenantId: number,
    stationId: string,
    certificateHashDataList: OCPP2_0_1.CertificateHashDataChainType[],
  ) {
    try {
      const certificateTypes = certificateHashDataList.map((certificateHashData) => {
        return certificateHashData.certificateType;
      });
      if (certificateTypes && certificateTypes.length > 0) {
        await this._installedCertificateRepository.deleteAllByQuery(tenantId, {
          where: {
            tenantId,
            stationId,
            certificateType: {
              [Op.in]: certificateTypes,
            },
          },
        });
      }
    } catch (error: any) {
      this._logger.error(
        'GetInstalledCertificateIds failed to delete previous certificates',
        error,
      );
    }
  }
}
