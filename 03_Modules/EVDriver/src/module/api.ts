// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IEVDriverModuleApi } from './interface';
import { EVDriverModule } from './module';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  AuthorizationDataSchema,
  CallAction,
  HttpMethod,
  IMessageConfirmation,
  Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion
} from '@citrineos/base';
import {
  AuthorizationQuerySchema,
  AuthorizationQuerystring,
  AuthorizationRestrictions,
  AuthorizationRestrictionsSchema,
  CallMessage,
  ChargingStationKeyQuerySchema,
  ChargingStationKeyQuerystring,
  LocalListVersion,
} from '@citrineos/data';
import { validateChargingProfileType } from '@citrineos/util';
import { v4 as uuidv4 } from 'uuid';

/**
 * Server API for the provisioning component.
 */
export class EVDriverModuleApi
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
  constructor(
    evDriverModule: EVDriverModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(evDriverModule, server, logger);
  }

  /**
   * Data Endpoint Methods
   */

  @AsDataEndpoint(
    Namespace.AuthorizationData,
    HttpMethod.Put,
    AuthorizationQuerySchema,
    AuthorizationDataSchema,
  )
  putAuthorization(
    request: FastifyRequest<{
      Body: OCPP2_0_1.AuthorizationData;
      Querystring: AuthorizationQuerystring;
    }>,
  ): Promise<OCPP2_0_1.AuthorizationData | undefined> {
    return this._module.authorizeRepository.createOrUpdateByQuerystring(
      request.body,
      request.query,
    );
  }

  @AsDataEndpoint(
    Namespace.AuthorizationRestrictions,
    HttpMethod.Put,
    AuthorizationQuerySchema,
    AuthorizationRestrictionsSchema,
  )
  putAuthorizationRestrictions(
    request: FastifyRequest<{
      Body: AuthorizationRestrictions;
      Querystring: AuthorizationQuerystring;
    }>,
  ): Promise<OCPP2_0_1.AuthorizationData[]> {
    return this._module.authorizeRepository.updateRestrictionsByQuerystring(
      request.body,
      request.query,
    );
  }

  @AsDataEndpoint(
    Namespace.AuthorizationData,
    HttpMethod.Get,
    AuthorizationQuerySchema,
  )
  getAuthorization(
    request: FastifyRequest<{ Querystring: AuthorizationQuerystring }>,
  ): Promise<OCPP2_0_1.AuthorizationData[]> {
    return this._module.authorizeRepository.readAllByQuerystring(request.query);
  }

  @AsDataEndpoint(
    Namespace.AuthorizationData,
    HttpMethod.Delete,
    AuthorizationQuerySchema,
  )
  deleteAuthorization(
    request: FastifyRequest<{ Querystring: AuthorizationQuerystring }>,
  ): Promise<string> {
    return this._module.authorizeRepository
      .deleteAllByQuerystring(request.query)
      .then(
        (deletedCount) =>
          deletedCount.toString() +
          ' rows successfully deleted from ' +
          Namespace.AuthorizationData,
      );
  }

  @AsDataEndpoint(
    Namespace.LocalListVersion,
    HttpMethod.Get,
    ChargingStationKeyQuerySchema,
  )
  async getLocalAuthorizationListVersion(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<LocalListVersion | undefined> {
    return await this._module.localAuthListRepository.readOnlyOneByQuery({
      stationId: request.query.stationId,
    });
  }

  /**
   * Message Endpoint Methods
   */

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.RequestStartTransaction,
    OCPP2_0_1.RequestStartTransactionRequestSchema,
  )
  async requestStartTransaction(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.RequestStartTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    let payloadMessage;
    if (request.chargingProfile) {
      const chargingProfile = request.chargingProfile;
      // Ocpp 2.0.1 Part 2 K05.FR.02
      if (
        chargingProfile.chargingProfilePurpose !==
        OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile
      ) {
        return {
          success: false,
          payload:
            'The Purpose of the ChargingProfile SHALL always be TxProfile.',
        };
      }

      // Ocpp 2.0.1 Part 2 K05 Description 8 Remarks
      if (chargingProfile.transactionId) {
        chargingProfile.transactionId = undefined;
        this._logger.warn(
          `A transactionId cannot be provided in the ChargingProfile`,
        );
      }

      // Validate ChargingProfileType's constraints
      try {
        await validateChargingProfileType(
          chargingProfile,
          identifier,
          this._module.deviceModelRepository,
          this._module.chargingProfileRepository,
          this._module.transactionEventRepository,
          this._logger,
          request.evseId,
        );
      } catch (error) {
        return {
          success: false,
          payload:
            error instanceof Error ? error.message : JSON.stringify(error),
        };
      }

      // OCPP 2.0.1 Part 2 K05.FR.04
      const smartChargingEnabled =
        await this._module.deviceModelRepository.readAllByQuerystring({
          component_name: 'SmartChargingCtrlr',
          variable_name: 'Enabled',
          stationId: identifier,
        });
      if (
        smartChargingEnabled.length > 0 &&
        smartChargingEnabled[0].value === 'false'
      ) {
        payloadMessage = `SmartCharging is not enabled on charger ${identifier}. The charging profile will be ignored.`;
        this._logger.warn(payloadMessage);
      } else {
        await this._module.chargingProfileRepository.createOrUpdateChargingProfile(
          chargingProfile,
          identifier,
          request.evseId,
        );
      }
    }

    const confirmation: IMessageConfirmation = await this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.RequestStartTransaction,
      request,
      callbackUrl,
    );
    if (payloadMessage) {
      return { success: true, payload: payloadMessage };
    } else {
      return confirmation;
    }
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.RequestStopTransaction,
    OCPP2_0_1.RequestStopTransactionRequestSchema,
  )
  async requestStopTransaction(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.RequestStopTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.RequestStopTransaction,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.CancelReservation,
    OCPP2_0_1.CancelReservationRequestSchema,
  )
  async cancelReservation(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.CancelReservationRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    try {
      const existingReservation =
        await this._module.reservationRepository.readOnlyOneByQuery({
          where: {
            id: request.reservationId,
            stationId: identifier,
          },
        });
      if (!existingReservation) {
        throw new Error(`Reservation ${request.reservationId} not found.`);
      }

      const correlationId = uuidv4();
      await this._module.callMessageRepository.create(
        CallMessage.build({
          correlationId,
          reservationId: existingReservation.databaseId,
        }),
      );

      return this._module.sendCall(
        identifier,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.CancelReservation,
        request,
        callbackUrl,
        correlationId,
      );
    } catch (error) {
      return {
        success: false,
        payload: error instanceof Error ? error.message : JSON.stringify(error),
      };
    }
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.ReserveNow, OCPP2_0_1.ReserveNowRequestSchema)
  async reserveNow(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.ReserveNowRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const storedReservation =
      await this._module.reservationRepository.createOrUpdateReservation(
        request,
        identifier,
        false,
      );
    if (!storedReservation) {
      return { success: false, payload: 'Reservation could not be stored.' };
    }

    const correlationId = uuidv4();
    await this._module.callMessageRepository.create(
      CallMessage.build({
        correlationId,
        reservationId: storedReservation.databaseId,
      }),
    );

    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.ReserveNow,
      request,
      callbackUrl,
      correlationId,
    );
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.UnlockConnector, OCPP2_0_1.UnlockConnectorRequestSchema)
  unlockConnector(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.UnlockConnectorRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.UnlockConnector,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.ClearCache, OCPP2_0_1.ClearCacheRequestSchema)
  clearCache(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.ClearCacheRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.ClearCache,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.SendLocalList, OCPP2_0_1.SendLocalListRequestSchema)
  async sendLocalList(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.SendLocalListRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const correlationId = uuidv4();
    await this._module.localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
      identifier,
      correlationId,
      request,
    );

    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.SendLocalList,
      request,
      callbackUrl,
      correlationId,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetLocalListVersion,
    OCPP2_0_1.GetLocalListVersionRequestSchema,
  )
  getLocalListVersion(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.GetLocalListVersionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.GetLocalListVersion,
      request,
      callbackUrl,
    );
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
