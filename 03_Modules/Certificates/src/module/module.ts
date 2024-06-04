// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  AttributeEnumType,
  CallAction,
  CertificateSignedRequest,
  CertificateSignedResponse,
  CertificateSigningUseEnumType,
  DeleteCertificateResponse,
  ErrorCode,
  EventGroup,
  GenericStatusEnumType,
  Get15118EVCertificateRequest,
  Get15118EVCertificateResponse,
  GetCertificateStatusEnumType,
  GetCertificateStatusRequest,
  GetCertificateStatusResponse,
  GetInstalledCertificateIdsResponse,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  InstallCertificateResponse,
  Iso15118EVCertificateStatusEnumType,
  SignCertificateRequest,
  SignCertificateResponse,
  SystemConfig,
} from '@citrineos/base';
import {
  ICertificateRepository,
  IDeviceModelRepository,
  ILocationRepository,
  sequelize,
} from '@citrineos/data';
import {
  CertificateAuthorityService,
  parseCSRForVerification,
  RabbitMqReceiver,
  RabbitMqSender,
  sendOCSPRequest,
  Timer,
} from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
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

  protected _requests: CallAction[] = [
    CallAction.Get15118EVCertificate,
    CallAction.GetCertificateStatus,
    CallAction.SignCertificate,
  ];

  protected _responses: CallAction[] = [
    CallAction.CertificateSigned,
    CallAction.DeleteCertificate,
    CallAction.GetInstalledCertificateIds,
    CallAction.InstallCertificate,
  ];

  protected _deviceModelRepository: IDeviceModelRepository;
  protected _certificateRepository: ICertificateRepository;
  protected _locationRepository: ILocationRepository;
  protected _certificateAuthorityService: CertificateAuthorityService;

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link CertificatesModule}.
   *
   * @param {SystemConfig} config - The `config` contains configuration settings for the module.
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
   * If no `deviceModelRepository` is provided, a default {@link sequelize.DeviceModelRepository} instance is created and used.
   *
   * @param {ICertificateRepository} [certificateRepository] - An optional parameter of type {@link ICertificateRepository} which
   * represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.CertificateRepository} instance is created and used.
   *
   * @param {ILocationRepository} [locationRepository] - An optional parameter of type {@link ILocationRepository} which
   * represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.LocationRepository} instance is created and used.
   *
   * @param {CertificateAuthorityService} [certificateAuthorityService] - An optional parameter of
   * type {@link CertificateAuthorityService} which handles certificate authority operations.
   */
  constructor(
    config: SystemConfig,
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

    const timer = new Timer();
    this._logger.info('Initializing...');

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error(
        'Could not initialize module due to failure in handler initialization.',
      );
    }

    this._deviceModelRepository =
      deviceModelRepository ||
      new sequelize.SequelizeDeviceModelRepository(config, logger);
    this._certificateRepository =
      certificateRepository ||
      new sequelize.SequelizeCertificateRepository(config, logger);
    this._locationRepository =
      locationRepository ||
      new sequelize.SequelizeLocationRepository(config, logger);

    this._certificateAuthorityService =
      certificateAuthorityService ||
      new CertificateAuthorityService(config, this._logger);

    this._logger.info(`Initialized in ${timer.end()}ms...`);
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

  @AsHandler(CallAction.Get15118EVCertificate)
  protected async _handleGet15118EVCertificate(
    message: IMessage<Get15118EVCertificateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Get15118EVCertificate received:', message, props);
    const request: Get15118EVCertificateRequest = message.payload;

    try {
      const exiResponse =
        await this._certificateAuthorityService.getSignedContractData(
          request.iso15118SchemaVersion,
          request.exiRequest,
        );
      this.sendCallResultWithMessage(message, {
        status: Iso15118EVCertificateStatusEnumType.Accepted,
        exiResponse: exiResponse,
      } as Get15118EVCertificateResponse);
    } catch (error) {
      this.sendCallResultWithMessage(message, {
        status: Iso15118EVCertificateStatusEnumType.Failed,
        statusInfo: {
          reasonCode: ErrorCode.GenericError,
          additionalInfo: error instanceof Error ? error.message : undefined,
        },
        exiResponse: '',
      } as Get15118EVCertificateResponse);
    }
  }

  @AsHandler(CallAction.GetCertificateStatus)
  protected async _handleGetCertificateStatus(
    message: IMessage<GetCertificateStatusRequest>,
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
      const ocspResponse = await sendOCSPRequest(
        ocspRequest,
        reqData.responderURL,
      );
      this.sendCallResultWithMessage(message, {
        status: GetCertificateStatusEnumType.Accepted,
        ocspResponse: ocspResponse,
      } as GetCertificateStatusResponse);
    } catch (error) {
      this._logger.error(`GetCertificateStatus failed: ${error}`);
      this.sendCallResultWithMessage(message, {
        status: GetCertificateStatusEnumType.Failed,
        statusInfo: { reasonCode: ErrorCode.GenericError },
      } as GetCertificateStatusResponse);
    }
  }

  @AsHandler(CallAction.SignCertificate)
  protected async _handleSignCertificate(
    message: IMessage<SignCertificateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Sign certificate request received:', message, props);
    const stationId: string = message.context.stationId;
    const csrString: string = message.payload.csr.replace(/\n/g, '');
    const certificateType: CertificateSigningUseEnumType | undefined =
      message.payload.certificateType;

    // TODO OCTT Currently fails the CSMS on test case TC_A_14_CSMS if an invalid csr is rejected
    //  Despite explicitly saying in the protocol "The CSMS may do some checks on the CSR"
    //  So it is necessary to accept before checking the csr. when this is fixed, this line can be removed
    //  And the other sendCallResultWithMessage for SignCertificateResponse can be uncommented
    this.sendCallResultWithMessage(message, {
      status: GenericStatusEnumType.Accepted,
    } as SignCertificateResponse);

    let certificateChainPem: string;
    try {
      await this._verifySignCertRequest(csrString, stationId, certificateType);

      certificateChainPem =
        await this._certificateAuthorityService.getCertificateChain(
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

    this.sendCall(
      stationId,
      message.context.tenantId,
      CallAction.CertificateSigned,
      {
        certificateChain: certificateChainPem,
        certificateType: certificateType,
      } as CertificateSignedRequest,
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.CertificateSigned)
  protected _handleCertificateSigned(
    message: IMessage<CertificateSignedResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('CertificateSigned received:', message, props);
    // TODO: If rejected, retry and/or send to callbackUrl if originally part of a triggered refresh
    // TODO: If accepted, revoke old certificate
  }

  @AsHandler(CallAction.DeleteCertificate)
  protected _handleDeleteCertificate(
    message: IMessage<DeleteCertificateResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('DeleteCertificate received:', message, props);
  }

  @AsHandler(CallAction.GetInstalledCertificateIds)
  protected _handleGetInstalledCertificateIds(
    message: IMessage<GetInstalledCertificateIdsResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetInstalledCertificateIds received:', message, props);
  }

  @AsHandler(CallAction.InstallCertificate)
  protected _handleInstallCertificate(
    message: IMessage<InstallCertificateResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('InstallCertificate received:', message, props);
  }

  private async _verifySignCertRequest(
    csrString: string,
    stationId: string,
    certificateType?: CertificateSigningUseEnumType,
  ): Promise<void> {
    // Verify certificate type
    if (
      !certificateType ||
      (certificateType !== CertificateSigningUseEnumType.V2GCertificate &&
        certificateType !==
          CertificateSigningUseEnumType.ChargingStationCertificate)
    ) {
      throw new Error(`Unsupported certificate type: ${certificateType}`);
    }

    // Verify CSR
    const csr: CertificationRequest = parseCSRForVerification(csrString);
    this._logger.info(`Verifying CSR: ${JSON.stringify(csr)}`);

    if (!(await csr.verify())) {
      throw new Error(
        'Verify the signature on this csr using its public key failed',
      );
    }

    if (
      certificateType ===
      CertificateSigningUseEnumType.ChargingStationCertificate
    ) {
      // Verify organization name match the one stored in the device model
      const organizationName =
        await this._deviceModelRepository.readAllByVAQuerystring({
          stationId: stationId,
          component_name: 'SecurityCtrlr',
          variable_name: 'OrganizationName',
          type: AttributeEnumType.Actual,
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
      if (
        organizationName[0].value !==
        organizationNameAttr.value.valueBlock.value
      ) {
        throw new Error(
          `Expect organizationName ${organizationName[0].value} but get ${organizationNameAttr.value} from the csr`,
        );
      }
    }

    this._logger.info(
      `Verified SignCertRequest for station ${stationId} successfully.`,
    );
  }
}
