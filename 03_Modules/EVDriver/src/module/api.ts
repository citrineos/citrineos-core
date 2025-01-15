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
  OCPP2_0_1_Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
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
    OCPP2_0_1_Namespace.AuthorizationData,
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
    OCPP2_0_1_Namespace.AuthorizationRestrictions,
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
    OCPP2_0_1_Namespace.AuthorizationData,
    HttpMethod.Get,
    AuthorizationQuerySchema,
  )
  getAuthorization(
    request: FastifyRequest<{ Querystring: AuthorizationQuerystring }>,
  ): Promise<OCPP2_0_1.AuthorizationData[]> {
    return this._module.authorizeRepository.readAllByQuerystring(request.query);
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.AuthorizationData,
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
          OCPP2_0_1_Namespace.AuthorizationData,
      );
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.LocalListVersion,
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
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.RequestStartTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const i of identifier) {
      let payloadMessage: string | undefined;

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
            payload:
              'The Purpose of the ChargingProfile SHALL always be TxProfile.',
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

      // Send the call to the station
      try {
        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.RequestStartTransaction,
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
          payload:
            error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return results;
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.RequestStopTransaction,
    OCPP2_0_1.RequestStopTransactionRequestSchema,
  )
  async requestStopTransaction(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.RequestStopTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.RequestStopTransaction,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.CancelReservation,
    OCPP2_0_1.CancelReservationRequestSchema,
  )
  async cancelReservation(
    identifiers: string[],
    tenantId: string,
    request: OCPP2_0_1.CancelReservationRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    try {
      // Attempt to load the reservations for each station ID
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

      // Identify any stations that did not have the reservation
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

      // Create a correlationId for each reservation/station
      const correlationIds = reservations.map((reservation) => {
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

      // Send the CancelReservation call for each station
      const results = await Promise.all(
        identifiers.map((identifier, index) =>
          this._module.sendCall(
            identifier,
            tenantId,
            OCPPVersion.OCPP2_0_1,
            OCPP2_0_1_CallAction.CancelReservation,
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
      // Return a failure for each requested station
      return identifiers.map(() => ({
        success: false,
        payload: error instanceof Error ? error.message : JSON.stringify(error),
      }));
    }
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.ReserveNow,
    OCPP2_0_1.ReserveNowRequestSchema,
  )
  async reserveNow(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.ReserveNowRequest,
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

        // Create correlationId for this reservation
        const correlationId = uuidv4();
        await this._module.callMessageRepository.create(
          CallMessage.build({
            correlationId,
            reservationId: storedReservation.databaseId,
          }),
        );

        // Send the ReserveNow call
        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.ReserveNow,
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
    OCPP2_0_1_CallAction.UnlockConnector,
    OCPP2_0_1.UnlockConnectorRequestSchema,
  )
  unlockConnector(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.UnlockConnectorRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.UnlockConnector,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.ClearCache,
    OCPP2_0_1.ClearCacheRequestSchema,
  )
  clearCache(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.ClearCacheRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.ClearCache,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.SendLocalList,
    OCPP2_0_1.SendLocalListRequestSchema,
  )
  async sendLocalList(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.SendLocalListRequest,
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
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.SendLocalList,
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
    OCPP2_0_1_CallAction.GetLocalListVersion,
    OCPP2_0_1.GetLocalListVersionRequestSchema,
  )
  getLocalListVersion(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.GetLocalListVersionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetLocalListVersion,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(
    input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace,
  ): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
