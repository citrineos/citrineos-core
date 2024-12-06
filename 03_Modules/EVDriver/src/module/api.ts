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
  AuthorizationData,
  AuthorizationDataSchema,
  CallAction,
  CancelReservationRequest,
  CancelReservationRequestSchema,
  ChargingProfilePurposeEnumType,
  ClearCacheRequest,
  ClearCacheRequestSchema,
  GetLocalListVersionRequest,
  GetLocalListVersionRequestSchema,
  HttpMethod,
  IMessageConfirmation,
  Namespace,
  RequestStartTransactionRequest,
  RequestStartTransactionRequestSchema,
  RequestStopTransactionRequest,
  RequestStopTransactionRequestSchema,
  ReserveNowRequest,
  ReserveNowRequestSchema,
  SendLocalListRequest,
  SendLocalListRequestSchema,
  UnlockConnectorRequest,
  UnlockConnectorRequestSchema,
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
      Body: AuthorizationData;
      Querystring: AuthorizationQuerystring;
    }>,
  ): Promise<AuthorizationData | undefined> {
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
  ): Promise<AuthorizationData[]> {
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
  ): Promise<AuthorizationData[]> {
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
    CallAction.RequestStartTransaction,
    RequestStartTransactionRequestSchema,
  )
  async requestStartTransaction(
    identifier: string[],
    tenantId: string,
    request: RequestStartTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const i of identifier) {
      let payloadMessage;

      if (request.chargingProfile) {
        const chargingProfile = { ...request.chargingProfile };

        if (
          chargingProfile.chargingProfilePurpose !==
          ChargingProfilePurposeEnumType.TxProfile
        ) {
          results.push({
            success: false,
            payload:
              'The Purpose of the ChargingProfile SHALL always be TxProfile.',
          });
          continue;
        }

        if (chargingProfile.transactionId) {
          chargingProfile.transactionId = undefined;
          this._logger.warn(
            `A transactionId cannot be provided in the ChargingProfile for station: ${i}`,
          );
        }

        try {
          await validateChargingProfileType(
            chargingProfile,
            i,
            this._module.deviceModelRepository,
            this._module.chargingProfileRepository,
            this._module.transactionEventRepository,
            this._logger,
            request.evseId,
          );

          const smartChargingEnabled =
            await this._module.deviceModelRepository.readAllByQuerystring({
              component_name: 'SmartChargingCtrlr',
              variable_name: 'Enabled',
              stationId: i,
            });

          if (
            smartChargingEnabled.length > 0 &&
            smartChargingEnabled[0].value === 'false'
          ) {
            payloadMessage = `SmartCharging is not enabled on charger ${i}. The charging profile will be ignored.`;
            this._logger.warn(payloadMessage);
          } else {
            await this._module.chargingProfileRepository.createOrUpdateChargingProfile(
              chargingProfile,
              i,
              request.evseId,
            );
          }
        } catch (error) {
          results.push({
            success: false,
            payload:
              error instanceof Error ? error.message : JSON.stringify(error),
          });
          continue;
        }
      }

      try {
        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          CallAction.RequestStartTransaction,
          request,
          callbackUrl,
        );

        results.push(
          payloadMessage
            ? { success: true, payload: payloadMessage }
            : confirmation,
        );
      } catch (error) {
        results.push({
          success: false,
          payload:
            error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return results;
  }

  @AsMessageEndpoint(
    CallAction.RequestStopTransaction,
    RequestStopTransactionRequestSchema,
  )
  async requestStopTransaction(
    identifier: string[],
    tenantId: string,
    request: RequestStopTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        CallAction.RequestStopTransaction,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    CallAction.CancelReservation,
    CancelReservationRequestSchema,
  )
  async cancelReservation(
    identifiers: string[],
    tenantId: string,
    request: CancelReservationRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    try {
      const reservations = await Promise.all(
        identifiers.map((identifier) =>
          this._module.reservationRepository.readOnlyOneByQuery({
            where: {
              id: request.reservationId,
              stationId: identifier,
            },
          }),
        ),
      );

      const missingReservations = identifiers.filter(
        (identifier, index) => !reservations[index],
      );

      if (missingReservations.length > 0) {
        throw new Error(
          `Reservation ${request.reservationId} not found for station IDs: ${missingReservations.join(
            ', ',
          )}.`,
        );
      }

      const correlationIds = reservations.map((reservation, index) => {
        const correlationId = uuidv4();
        if (reservation) {
          this._module.callMessageRepository.create(
            CallMessage.build({
              correlationId,
              reservationId: reservation.databaseId,
            }),
          );
        }
        return correlationId;
      });

      const results = await Promise.all(
        identifiers.map((identifier, index) =>
          this._module.sendCall(
            identifier,
            tenantId,
            CallAction.CancelReservation,
            request,
            callbackUrl,
            correlationIds[index],
          ),
        ),
      );

      return results;
    } catch (error) {
      this._logger.error(
        `CancelReservation request failed: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );

      return identifiers.map(() => ({
        success: false,
        payload: error instanceof Error ? error.message : JSON.stringify(error),
      }));
    }
  }

  @AsMessageEndpoint(CallAction.ReserveNow, ReserveNowRequestSchema)
  async reserveNow(
    identifier: string[],
    tenantId: string,
    request: ReserveNowRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];
    for (const i of identifier) {
      try {
        const storedReservation =
          await this._module.reservationRepository.createOrUpdateReservation(
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
  
        const correlationId = uuidv4();
        await this._module.callMessageRepository.create(
          CallMessage.build({
            correlationId,
            reservationId: storedReservation.databaseId,
          }),
        );
  
        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          CallAction.ReserveNow,
          request,
          callbackUrl,
          correlationId,
        );
  
        results.push(confirmation);
      } catch (error) {
        results.push({
          success: false,
          payload:
            error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }
  
    return results;
  }

  @AsMessageEndpoint(CallAction.UnlockConnector, UnlockConnectorRequestSchema)
  unlockConnector(
    identifier: string[],
    tenantId: string,
    request: UnlockConnectorRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        CallAction.UnlockConnector,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(CallAction.ClearCache, ClearCacheRequestSchema)
  clearCache(
    identifier: string[],
    tenantId: string,
    request: ClearCacheRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        CallAction.ClearCache,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(CallAction.SendLocalList, SendLocalListRequestSchema)
  async sendLocalList(
    identifier: string[],
    tenantId: string,
    request: SendLocalListRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];
  
    for (const i of identifier) {
      try {
        const correlationId = uuidv4();
  
        await this._module.localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
          i,
          correlationId,
          request,
        );
  
        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          CallAction.SendLocalList,
          request,
          callbackUrl,
          correlationId,
        );
  
        results.push(confirmation);
      } catch (error) {
        results.push({
          success: false,
          payload:
            error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }
  
    return results;
  }

  @AsMessageEndpoint(
    CallAction.GetLocalListVersion,
    GetLocalListVersionRequestSchema,
  )
  getLocalListVersion(
    identifier: string[],
    tenantId: string,
    request: GetLocalListVersionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        CallAction.GetLocalListVersion,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
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
