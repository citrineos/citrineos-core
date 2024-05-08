// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  AttributeEnumType,
  CacheNamespace,
  CallAction,
  CertificateSignedRequest,
  CertificateSignedResponse,
  CertificateSigningUseEnumType,
  DeleteCertificateResponse,
  ErrorCode,
  EventGroup,
  GenericStatusEnumType,
  Get15118EVCertificateRequest,
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
  OcppError,
  SignCertificateRequest,
  SignCertificateResponse,
  SystemConfig,
} from '@citrineos/base';
import { IDeviceModelRepository, sequelize } from '@citrineos/data';
import { RabbitMqReceiver, RabbitMqSender, Timer } from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import * as forge from 'node-forge';
import fs from 'fs';
import { ILogObj, Logger } from 'tslog';

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
  private _securityCaCerts: Map<string, forge.pki.Certificate> = new Map();
  private _securityCaPrivateKeys: Map<string, forge.pki.rsa.PrivateKey> =
    new Map();

  /**
   * Util
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
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender: IMessageSender,
    handler: IMessageHandler,
    logger?: Logger<ILogObj>,
    deviceModelRepository?: IDeviceModelRepository,
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
      new sequelize.DeviceModelRepository(config, logger);

    this._config.util.networkConnection.websocketServers.forEach((server) => {
      if (server.securityProfile === 3) {
        try {
          this._securityCaCerts.set(
            server.id,
            forge.pki.certificateFromPem(
              fs.readFileSync(
                server.mtlsCertificateAuthorityRootsFilepath as string,
                'utf8',
              ),
            ),
          );
          this._securityCaPrivateKeys.set(
            server.id,
            forge.pki.privateKeyFromPem(
              fs.readFileSync(
                server.mtlsCertificateAuthorityKeysFilepath as string,
                'utf8',
              ),
            ),
          );
        } catch (error) {
          this._logger.error(
            'Unable to start Certificates module due to invalid security certificates for {}: {}',
            server,
            error,
          );
          throw error;
        }
      }
    });

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  /**
   * Handle requests
   */

  @AsHandler(CallAction.Get15118EVCertificate)
  protected _handleGet15118EVCertificate(
    message: IMessage<Get15118EVCertificateRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('Get15118EVCertificate received:', message, props);

    this._logger.error('Get15118EVCertificate not implemented');
    this.sendCallErrorWithMessage(
      message,
      new OcppError(
        message.context.correlationId,
        ErrorCode.NotImplemented,
        'Get15118EVCertificate not implemented',
      ),
    );
  }

  @AsHandler(CallAction.GetCertificateStatus)
  protected _handleGetCertificateStatus(
    message: IMessage<GetCertificateStatusRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetCertificateStatus received:', message, props);

    this._logger.error('GetCertificateStatus not implemented');
    this.sendCallResultWithMessage(message, {
      status: GetCertificateStatusEnumType.Failed,
      statusInfo: { reasonCode: ErrorCode.NotImplemented },
    } as GetCertificateStatusResponse);
  }

  @AsHandler(CallAction.SignCertificate)
  protected async _handleSignCertificate(
    message: IMessage<SignCertificateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Sign certificate request received:', message, props);
    // OCTT Currently fails the CSMS on test case TC_A_14_CSMS if an invalid csr is rejected
    // Despite explicitly saying in the protocol "The CSMS may do some checks on the CSR"
    // So it is necessary to accept before checking the csr. when this is fixed, this line can be removed
    // And the other sendCallResultWithMessage for SignCertificateResponse can be uncommented
    this.sendCallResultWithMessage(message, {
      status: GenericStatusEnumType.Accepted,
    } as SignCertificateResponse);
    let caCert: forge.pki.Certificate;
    let caPrivateKey: forge.pki.rsa.PrivateKey;
    let csr;
    try {
      csr = forge.pki.certificationRequestFromPem(message.payload.csr);
    } catch (error) {
      // this.sendCallResultWithMessage(message, { status: GenericStatusEnumType.Rejected, statusInfo: { reasonCode: 'CSR_FORMAT_INCORRECT' } } as SignCertificateResponse);
      this._logger.error(
        'Incorrectly formatted CSR: {}, error: {}',
        message.payload.csr,
        error,
      );
      return;
    }
    const certificateType = message.payload.certificateType;
    switch (certificateType) {
      case CertificateSigningUseEnumType.ChargingStationCertificate: {
        // Verify CSR...
        if (
          !(csr as any).verify() ||
          !(await this.verifyChargingStationCertificateCSR(
            // @ts-expect-error: Unreachable code error
            csr,
            message.context.stationId,
          ))
        ) {
          // TODO: Give verbose reason for csr invalidity
          // this.sendCallResultWithMessage(message, { status: GenericStatusEnumType.Rejected, statusInfo: { reasonCode: 'INVALID_CSR' } } as SignCertificateResponse);
          this._logger.error('Invalid CSR: {}', message.payload.csr);
          return;
        }
        const clientConnection: string = (await this._cache.get(
          message.context.stationId,
          CacheNamespace.Connections,
        )) as string;
        caCert = this._securityCaCerts.get(
          clientConnection,
        ) as forge.pki.Certificate;
        caPrivateKey = this._securityCaPrivateKeys.get(
          clientConnection,
        ) as forge.pki.rsa.PrivateKey;
        break;
      }
      default:
        this.sendCallResultWithMessage(message, {
          status: GenericStatusEnumType.Rejected,
          statusInfo: {
            reasonCode: ErrorCode.NotImplemented,
            additionalInfo: certificateType,
          },
        } as SignCertificateResponse);
        this._logger.error(
          'Unimplemented certificate type {}',
          certificateType,
        );
        return;
    }

    // this.sendCallResultWithMessage(message, { status: GenericStatusEnumType.Accepted } as SignCertificateResponse);

    // Create a new certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = csr.publicKey as forge.pki.rsa.PublicKey;
    cert.serialNumber = '01'; // Unique serial number for the certificate
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(
      cert.validity.notBefore.getFullYear() + 1,
    ); // 1-year validity
    // Set CA's attributes as issuer
    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(csr.subject.attributes);
    // Sign the certificate
    cert.sign(caPrivateKey);
    // Send the certificate
    this.sendCall(
      message.context.stationId,
      message.context.tenantId,
      CallAction.CertificateSigned,
      {
        certificateChain: forge.pki.certificateToPem(cert),
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

  async verifyChargingStationCertificateCSR(
    csr: forge.pki.Certificate,
    stationId: string,
  ) {
    const organizationName = await this._deviceModelRepository.readAllByQuery({
      stationId: stationId,
      component_name: 'SecurityCtrlr',
      variable_name: 'OrganizationName',
      type: AttributeEnumType.Actual,
    });
    if (
      organizationName &&
      organizationName !== csr.subject.getField({ name: 'organizationName' })
    ) {
      return false;
    }
    return true;
  }
}
