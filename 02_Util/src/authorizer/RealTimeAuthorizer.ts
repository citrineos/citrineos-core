// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  type AuthorizationStatusEnumType,
  type ConnectorDto,
  type EvseDto,
  type IAuthorizer,
  type IdTokenEnumType,
  type IMessageContext,
  type SystemConfig,
} from '@citrineos/base';
import type { Authorization, ILocationRepository } from '@citrineos/data';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { OidcTokenProvider } from '../authorization/index.js';

export interface RealTimeAuthorizationRequestBody {
  tenantPartnerId: number;
  idToken: string;
  idTokenType: IdTokenEnumType;
  locationId?: string;
  stationId: string;
  evseId: number;
  connectorId: number;
}

export interface RealTimeAuthorizationResponse {
  timestamp: string;
  data: {
    allowed: string;
    reason?: string;
  };
}

export class RealTimeAuthorizer implements IAuthorizer {
  private _locationRepository: ILocationRepository;
  private _config: SystemConfig;
  private readonly _logger: Logger<ILogObj>;
  private readonly _oidcTokenProvider?: OidcTokenProvider;

  constructor(
    locationRepository: ILocationRepository,
    config: SystemConfig,
    logger?: Logger<ILogObj>,
  ) {
    this._locationRepository = locationRepository;
    this._config = config;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    if (config.oidcClient) {
      this._oidcTokenProvider = new OidcTokenProvider(config.oidcClient, this._logger);
    }
  }

  async authorize(
    authorization: Authorization,
    context: IMessageContext,
    evse?: EvseDto,
    connector?: ConnectorDto,
  ): Promise<AuthorizationStatusEnumType> {
    if (!authorization.realTimeAuthUrl) {
      this._logger.debug(`No Realtime Auth URL from authorization ${authorization.id}`);
      return authorization.status;
    } else if (
      !authorization.realTimeAuth ||
      authorization.realTimeAuth === AuthorizationWhitelistEnum.Allowed
    ) {
      this._logger.debug(`Realtime Auth whitelisted for authorization ${authorization.id}`);
      return authorization.status;
    } else if (authorization.status !== AuthorizationStatusEnum.Accepted) {
      this._logger.debug(
        `Skipping Realtime Auth for authorization ${authorization.id} with status ${authorization.status}`,
      );
      return authorization.status;
    }

    let evseId = undefined;
    let connectorId = undefined;
    let result: AuthorizationStatusEnumType = AuthorizationStatusEnum.Invalid;
    try {
      const chargingStation = await this._locationRepository.readChargingStationByStationId(
        context.tenantId,
        context.stationId,
      );

      // Determine evseId and connectorId
      // Priority: provided evse and connector > provided evse with single connector > station with single evse and single connector
      if (evse && connector) {
        evseId = evse.id!;
        connectorId = connector.id!;
      } else if (evse && !connector && evse.connectors?.length === 1) {
        evseId = evse.id!;
        connectorId = evse.connectors[0].id!;
      } else if (
        chargingStation &&
        chargingStation.evses &&
        chargingStation.evses.length === 1 &&
        chargingStation.evses[0].connectors?.length === 1
      ) {
        evseId = chargingStation.evses[0].id!;
        connectorId = chargingStation.evses[0].connectors![0].id!;
      }

      if (evseId === undefined || connectorId === undefined) {
        this._logger.error(
          `Cannot determine evseId and connectorId for Realtime Auth of authorization ${authorization.id}`,
        );
        return authorization.status;
      } else if (authorization.realTimeAuthLastAttempt) {
        const realTimeAuthLastAttempt = authorization.realTimeAuthLastAttempt;
        // Check if last attempt was at the same station and connector within the timeout period
        if (
          context.stationId === realTimeAuthLastAttempt.stationId &&
          connectorId! === realTimeAuthLastAttempt.connectorId
        ) {
          const lastAttempt = new Date(realTimeAuthLastAttempt.timestamp);
          const timeout =
            authorization.realTimeAuthTimeout ?? this._config.realTimeAuthDefaultTimeoutSeconds;
          const now = new Date();
          const diffInSeconds = (now.getTime() - lastAttempt.getTime()) / 1000;
          if (diffInSeconds < timeout) {
            this._logger.debug(
              `Skipping Realtime Auth for authorization ${authorization.id} due to timeout (${diffInSeconds}s < ${timeout}s)`,
            );
            return realTimeAuthLastAttempt.result;
          }
        }
      }

      const payload: RealTimeAuthorizationRequestBody = {
        tenantPartnerId: authorization.tenantPartnerId!, // Required if authorization has RealTimeAuth
        idToken: authorization.idToken,
        idTokenType: authorization.idTokenType!,
        locationId: chargingStation!.locationId!.toString(),
        stationId: context.stationId,
        evseId: evseId,
        connectorId: connectorId,
      };

      this._logger.debug(
        `Sending Realtime Auth request for authorization ${authorization.id} to url: ${authorization.realTimeAuthUrl}`,
      );

      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
      };

      if (this._oidcTokenProvider) {
        try {
          const token = await this._oidcTokenProvider.getToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          this._logger.error('Failed to get OIDC token:', error);
          return AuthorizationStatusEnum.Invalid;
        }
      }

      const response = await fetch(authorization.realTimeAuthUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseJson = await response.json();

      const realTimeAuth: RealTimeAuthorizationResponse =
        responseJson as RealTimeAuthorizationResponse;
      this._logger.debug(`Real time auth response: ${realTimeAuth.data.allowed}`);
      if (realTimeAuth) {
        switch (realTimeAuth.data.allowed) {
          case 'ALLOWED':
            result = AuthorizationStatusEnum.Accepted;
            break;
          case 'BLOCKED':
            result = AuthorizationStatusEnum.Blocked;
            break;
          case 'EXPIRED':
            result = AuthorizationStatusEnum.Expired;
            break;
          case 'NO_CREDIT':
            result = AuthorizationStatusEnum.NoCredit;
            break;
          case 'NOT_ALLOWED':
            result = AuthorizationStatusEnum.NotAtThisLocation;
            break;
          default:
            result = AuthorizationStatusEnum.Unknown;
        }
      } else {
        result = AuthorizationStatusEnum.Unknown;
      }
    } catch (error) {
      this._logger.error(`Real-Time Auth failed: ${error}`);
      if (authorization.realTimeAuth === 'AllowedOffline') {
        result = AuthorizationStatusEnum.Accepted;
      }
    }

    authorization.realTimeAuthLastAttempt = {
      timestamp: new Date().toISOString(),
      result,
      stationId: context.stationId,
      evseId: evseId,
      connectorId: connectorId!,
    };
    authorization.save().catch((error) => {
      this._logger.error(
        `Failed to save realTimeAuthLastAttempt for authorization ${authorization.id}: ${error}`,
      );
    });

    return result;
  }
}
