// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  type AuthorizationStatusEnumType,
  type IAuthorizer,
  type IdTokenEnumType,
  type IMessageContext,
  type SystemConfig,
} from '@citrineos/base';
import type { ILocationRepository } from '@citrineos/data';
import { Authorization } from '@citrineos/data';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { OidcTokenProvider } from '../authorization/index.js';

export interface RealTimeAuthorizationRequestBody {
  tenantPartnerId: number;
  idToken: string;
  idTokenType: IdTokenEnumType;
  locationId?: string;
  stationId?: string;
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
  private readonly _logger: Logger<ILogObj>;
  private readonly _oidcTokenProvider?: OidcTokenProvider;

  constructor(
    locationRepository: ILocationRepository,
    config: SystemConfig,
    logger?: Logger<ILogObj>,
  ) {
    this._locationRepository = locationRepository;
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

    let result: AuthorizationStatusEnumType = AuthorizationStatusEnum.Invalid;
    try {
      const chargingStation = await this._locationRepository.readChargingStationByStationId(
        context.tenantId,
        context.stationId,
      );

      const payload: RealTimeAuthorizationRequestBody = {
        tenantPartnerId: authorization.tenantPartnerId!, // Required if authorization has RealTimeAuth
        idToken: authorization.idToken,
        idTokenType: authorization.idTokenType!,
        locationId: chargingStation!.locationId!.toString(),
        stationId: context.stationId,
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

    return result;
  }
}
