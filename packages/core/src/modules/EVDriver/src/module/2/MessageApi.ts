// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, IMessageConfirmation } from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  AttributeEnum,
  CacheNamespace,
  DEFAULT_TENANT_ID,
  getOcpp2Schema,
  OCPP2_0_1,
  OCPP2_1,
  OCPP2_request_types,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { OCPP2_0_1_Mapper } from '@dal/index.js';
import { packageGroupCall, TotpUtil, validateChargingProfileType } from '@util/index.js';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';
import type { IEVDriverModuleApi, InitiateWebPaymentRequest } from '../interface.js';
import { InitiateWebPaymentRequestSchema } from '../interface.js';
import { EVDriverModule } from '../module.js';

const DEFAULT_VERSION = OCPPVersion.OCPP2_0_1;

export class EVDriverOcpp2Api
  extends AbstractModuleApi<EVDriverModule>
  implements IEVDriverModuleApi
{
  /**
   * Constructs a new instance of the class.
   *
   * @param {EVDriverModule} evDriverModule - The EVDriver module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger for logging.
   */
  constructor({
    evDriverModule,
    server,
    logger,
  }: {
    evDriverModule: EVDriverModule;
    server: FastifyInstance;
    logger?: Logger<ILogObj>;
  }) {
    super(evDriverModule, server, logger);
    // The C25 web-payment endpoint is 2.1-only, but its path is version-agnostic
    // (POST /evdriver/webpayment/initiate, not under /ocpp/<v>/). Register it once
    // since this single instance serves 2.1.
    if (this.supportedVersions.includes(OCPPVersion.OCPP2_1)) {
      this._registerInitiateWebPaymentRoute();
    }
  }

  protected get supportedVersions(): OCPPVersion[] {
    return [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];
  }

  //TODO: 2.1 needs extended code for this request
  @AsMessageEndpoint(
    OCPP_CallAction.RequestStartTransaction,
    (_instance: EVDriverOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'RequestStartTransactionRequestSchema',
      ),
  )
  async requestStartTransaction(
    identifier: string[],
    request: OCPP2_request_types.RequestStartTransactionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const i of identifier) {
      let payloadMessage: string | undefined;

      // F07: Store transactionLimit in cache for remote start with fixed cost, energy, SoC or time
      // The limit will be retrieved when TransactionEvent(Started) arrives with matching remoteStartId
      if (version === OCPPVersion.OCPP2_1 && request.customData?.transactionLimit) {
        try {
          const transactionLimit = request.customData
            .transactionLimit as OCPP2_1.TransactionLimitType;
          const cacheKey = `remotestart:${tenantId}:${i}:${request.remoteStartId}`;
          const cacheTTL = 300; // 5 minutes - should be enough for transaction to start

          await this._module.cache.set(
            cacheKey,
            JSON.stringify(transactionLimit),
            CacheNamespace.Other,
            cacheTTL,
          );

          this._logger.info(
            `Stored transactionLimit for RequestStartTransaction on station ${i}, ` +
              `remoteStartId=${request.remoteStartId}: ` +
              `maxCost=${transactionLimit.maxCost}, maxEnergy=${transactionLimit.maxEnergy}, ` +
              `maxTime=${transactionLimit.maxTime}, maxSoC=${transactionLimit.maxSoC}`,
          );
        } catch (error) {
          this._logger.error(
            `Failed to store transactionLimit for remoteStartId ${request.remoteStartId}`,
            error,
          );
        }
      }

      // If a Charging Profile is provided, do additional validations
      if (request.chargingProfile) {
        const chargingProfile = { ...request.chargingProfile };

        // In OCPP 2.0.1, the Purpose of the charging profile for a transaction MUST be TxProfile.
        if (
          chargingProfile.chargingProfilePurpose !==
          OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile
        ) {
          results.push({
            success: false,
            payload: 'The Purpose of the ChargingProfile SHALL always be TxProfile.',
          });
          continue;
        }

        // It's not valid to supply a transactionId in the charging profile for a new transaction
        if (chargingProfile.transactionId) {
          chargingProfile.transactionId = undefined;
          this._logger.warn(
            `A transactionId cannot be provided in the ChargingProfile for station: ${i}`,
          );
        }

        // Attempt to validate and possibly store the charging profile
        try {
          await validateChargingProfileType(
            chargingProfile,
            tenantId,
            i,
            this._module.deviceModelRepository,
            this._module.chargingProfileRepository,
            this._module.transactionEventRepository,
            this._logger,
            request.evseId,
          );

          const smartChargingEnabled =
            await this._module.deviceModelRepository.readAllByQuerystring(tenantId, {
              component_name: 'SmartChargingCtrlr',
              variable_name: 'Enabled',
              tenantId,
              ocppConnectionName: i,
            });

          if (smartChargingEnabled.length > 0 && smartChargingEnabled[0].value === 'false') {
            payloadMessage = `SmartCharging is not enabled on charger ${i}. The charging profile will be ignored.`;
            this._logger.warn(payloadMessage);
          } else {
            await this._module.chargingProfileRepository.createOrUpdateChargingProfile(
              tenantId,
              OCPP2_0_1_Mapper.ChargingProfileMapper.fromChargingProfileType(chargingProfile),
              i,
              request.evseId,
            );
          }
        } catch (error) {
          results.push({
            success: false,
            payload: error instanceof Error ? error.message : JSON.stringify(error),
          });
          continue;
        }
      }

      // Send the call to the station
      try {
        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          version,
          OCPP_CallAction.RequestStartTransaction,
          request,
          callbackUrl,
        );

        if (payloadMessage) {
          // We have a valid confirmation, plus a warning message
          results.push({
            success: true,
            payload: payloadMessage,
          });
        } else {
          results.push(confirmation);
        }
      } catch (error) {
        results.push({
          success: false,
          payload: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return results;
  }

  @AsMessageEndpoint(
    OCPP_CallAction.RequestStopTransaction,
    (_instance: EVDriverOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'RequestStopTransactionRequestSchema',
      ),
  )
  async requestStopTransaction(
    identifier: string[],
    request: OCPP2_request_types.RequestStopTransactionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.RequestStopTransaction,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.CancelReservation, (_instance: EVDriverOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'CancelReservationRequestSchema',
    ),
  )
  async cancelReservation(
    identifiers: string[],
    request: OCPP2_request_types.CancelReservationRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    try {
      // Attempt to load the reservations for each station ID
      const reservations = await Promise.all(
        identifiers.map((identifier) =>
          this._module.reservationRepository.readOnlyOneByQuery(tenantId, {
            where: {
              id: request.reservationId,
              ocppConnectionName: identifier,
              tenantId,
            },
          }),
        ),
      );

      // Identify any stations that did not have the reservation
      const missingReservations = identifiers.filter((identifier, index) => !reservations[index]);
      if (missingReservations.length > 0) {
        throw new Error(
          `Reservation ${request.reservationId} not found for station IDs: ${missingReservations.join(
            ', ',
          )}.`,
        );
      }

      // Send the CancelReservation call for each station
      return packageGroupCall(
        this._module,
        identifiers,
        tenantId,
        version,
        OCPP_CallAction.CancelReservation,
        request,
        callbackUrl,
      );
    } catch (error) {
      this._logger.error(
        `CancelReservation request failed: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
      // Return a failure for each requested station
      return identifiers.map(() => ({
        success: false,
        payload: error instanceof Error ? error.message : JSON.stringify(error),
      }));
    }
  }

  @AsMessageEndpoint(OCPP_CallAction.ReserveNow, (_instance: EVDriverOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'ReserveNowRequestSchema',
    ),
  )
  async reserveNow(
    identifier: string[],
    request: OCPP2_request_types.ReserveNowRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const i of identifier) {
      try {
        const storedReservation =
          await this._module.reservationRepository.createOrUpdateReservation(
            tenantId,
            request,
            i,
            false,
          );

        if (!storedReservation) {
          results.push({
            success: false,
            payload: `Reservation could not be stored for station: ${i}.`,
          });
          continue;
        }

        // Send the ReserveNow call
        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP_CallAction.ReserveNow,
          request,
          callbackUrl,
        );

        results.push(confirmation);
      } catch (error) {
        results.push({
          success: false,
          payload: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return results;
  }

  @AsMessageEndpoint(OCPP_CallAction.UnlockConnector, (_instance: EVDriverOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'UnlockConnectorRequestSchema',
    ),
  )
  unlockConnector(
    identifier: string[],
    request: OCPP2_request_types.UnlockConnectorRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.UnlockConnector,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.ClearCache, (_instance: EVDriverOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'ClearCacheRequestSchema',
    ),
  )
  clearCache(
    identifier: string[],
    request: OCPP2_request_types.ClearCacheRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.ClearCache,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.SendLocalList, (_instance: EVDriverOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'SendLocalListRequestSchema',
    ),
  )
  async sendLocalList(
    identifier: string[],
    request: OCPP2_request_types.SendLocalListRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const i of identifier) {
      try {
        const correlationId = uuidv4();

        await this._module.localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
          tenantId,
          i,
          correlationId,
          request,
        );

        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          version,
          OCPP_CallAction.SendLocalList,
          request,
          callbackUrl,
          correlationId,
        );

        results.push(confirmation);
      } catch (error) {
        results.push({
          success: false,
          payload: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return results;
  }

  @AsMessageEndpoint(OCPP_CallAction.GetLocalListVersion, (_instance: EVDriverOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetLocalListVersionRequestSchema',
    ),
  )
  getLocalListVersion(
    identifier: string[],
    request: OCPP2_request_types.GetLocalListVersionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.GetLocalListVersion,
      request,
      callbackUrl,
    );
  }

  /**
   * C25.FR.21-22: Sends NotifyWebPaymentStartedRequest to a charging station.
   * CSMS uses this to lock the EVSE during the web payment process, preventing
   * other users from occupying the EVSE while the driver completes payment.
   * Only applicable to OCPP 2.1 stations.
   */
  @AsMessageEndpoint(OCPP_CallAction.NotifyWebPaymentStarted, () =>
    getOcpp2Schema(OCPPVersion.OCPP2_1, 'NotifyWebPaymentStartedRequestSchema'),
  )
  async notifyWebPaymentStarted(
    identifier: string[],
    request: OCPP2_1.NotifyWebPaymentStartedRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      OCPPVersion.OCPP2_1,
      OCPP_CallAction.NotifyWebPaymentStarted,
      request,
      callbackUrl,
    );
  }

  /**
   * Registers a custom REST endpoint for initiating a C25 QR-code web payment session.
   *
   * POST /evdriver/webpayment/initiate
   *
   * This endpoint is called by the CSMS web page after the EV driver scans a QR code.
   * It validates the TOTP embedded in the QR URL (C25.FR.07-09), caches the driver's
   * optional transaction limits (C25.FR.03-06), and sends NotifyWebPaymentStartedRequest
   * to the charging station to lock the EVSE (C25.FR.21-22).
   *
   * Body parameters:
   * - identifier (string, required): Charging station ID
   * - evseId (integer, required): EVSE ID from the QR URL
   * - totp (string, required): TOTP value from the QR URL
   * - maxCost (number, optional): Maximum cost in currency units (C25.FR.56)
   * - maxTime (integer, optional): Maximum duration in seconds (C25.FR.57)
   * - maxEnergy (number, optional): Maximum energy in Wh (C25.FR.58)
   * - timeout (integer, optional): EVSE lock timeout in seconds (default: 300)
   * - tenantId (integer, optional): Tenant ID (default: DEFAULT_TENANT_ID)
   */
  private _registerInitiateWebPaymentRoute(): void {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    const routePath = `${endpointPrefix}/webpayment/initiate`;

    this._server.post(
      routePath,
      {
        schema: {
          body: InitiateWebPaymentRequestSchema,
        },
      },
      async (request, reply) => {
        const body = request.body as InitiateWebPaymentRequest;

        const { identifier, evseId, totp, maxCost, maxTime, maxEnergy } = body;
        const tenantId = body.tenantId ?? DEFAULT_TENANT_ID;
        const lockTimeout = body.timeout ?? 300;

        // Read WebPaymentsCtrlr.SharedSecret from the device model (C25.FR.01, C25.FR.50)
        let sharedSecret: string | undefined;
        try {
          const sharedSecretAttrs = await this._module.deviceModelRepository.readAllByQuerystring(
            tenantId,
            {
              tenantId,
              ocppConnectionName: identifier,
              component_name: 'WebPaymentsCtrlr',
              variable_name: 'SharedSecret',
              type: AttributeEnum.Actual,
            },
          );
          sharedSecret = sharedSecretAttrs[0]?.value ?? undefined;
        } catch (error) {
          this._logger.error(
            `Failed to read WebPaymentsCtrlr.SharedSecret for station ${identifier}`,
            error,
          );
          return reply
            .code(503)
            .send({ error: 'Failed to read station configuration. Please try again.' });
        }

        if (!sharedSecret) {
          this._logger.warn(
            `WebPaymentsCtrlr.SharedSecret not configured for station ${identifier}`,
          );
          return reply.code(503).send({ error: 'Web payment not configured for this station.' });
        }

        // Validate TOTP (C25.FR.07: invalid TOTP must not proceed)
        if (!TotpUtil.validate(sharedSecret, totp)) {
          this._logger.warn(
            `TOTP validation failed for station ${identifier}, evseId=${evseId}. ` +
              'QR code may be expired or fraudulent.',
          );
          return reply
            .code(401)
            .send({ error: 'TOTP validation failed. The QR code may be expired.' });
        }

        // Cache the QR transaction limits keyed by stationId:evseId (C25.FR.03-06, C25.FR.56-58)
        // These are read by the TransactionEvent handler to set transactionLimit in the response.
        const cacheKey = `webpayment:${tenantId}:${identifier}:${evseId}`;
        const limits = { maxCost, maxTime, maxEnergy };
        await this._module.cache.set(
          cacheKey,
          JSON.stringify(limits),
          CacheNamespace.Other,
          lockTimeout,
        );

        // Send NotifyWebPaymentStarted to CS to lock the EVSE (C25.FR.21-22, optional)
        try {
          await this._module.sendCall(
            identifier,
            tenantId,
            OCPPVersion.OCPP2_1,
            OCPP_CallAction.NotifyWebPaymentStarted,
            { evseId, timeout: lockTimeout } as OCPP2_1.NotifyWebPaymentStartedRequest,
          );
          this._logger.info(
            `NotifyWebPaymentStarted sent to station ${identifier}, ` +
              `evseId=${evseId}, timeout=${lockTimeout}s`,
          );
        } catch (error) {
          // Non-fatal: the EVSE notification is optional per C25.FR.21 ("MAY send")
          this._logger.warn(
            `NotifyWebPaymentStarted to station ${identifier} failed (non-fatal): ${error}`,
          );
        }

        return reply.send({
          success: true,
          stationId: identifier,
          evseId,
          timeout: lockTimeout,
          limits: { maxCost, maxTime, maxEnergy },
        });
      },
    );

    this._logger.info(`Registered web payment initiation endpoint at POST ${routePath}`);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction, version?: OCPPVersion | null): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toMessagePath(input, version, endpointPrefix);
  }
}
