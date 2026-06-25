// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AuthorizationStatusEnum,
  type AuthorizationStatusEnumType,
  type ConnectorDto,
  type EvseDto,
  type IAuthorizer,
  type IMessageContext,
} from '@citrineos/base';
import type { Authorization } from '@citrineos/data';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

/**
 * Kabisa per-token station scope (Tags & Operations).
 *
 * If an Authorization carries an `allowedChargingStations` allow-list, the token
 * may only authorize at those charging stations — anywhere else returns
 * `NotAtThisLocation`. An empty/undefined list means no station restriction.
 * The Kabisa backend sets this list from a tag's scope.
 */
export class KabisaScopeAuthorizer implements IAuthorizer {
  private readonly _logger: Logger<ILogObj>;

  constructor(logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async authorize(
    authorization: Authorization,
    context: IMessageContext,
    _evse?: EvseDto,
    _connector?: ConnectorDto,
  ): Promise<AuthorizationStatusEnumType> {
    const allowed = authorization.allowedChargingStations;
    // No scope set -> don't constrain; pass the token's existing status through.
    if (!allowed || allowed.length === 0) {
      return authorization.status;
    }
    if (allowed.includes(context.stationId)) {
      return authorization.status;
    }
    this._logger.info(
      `Token ${authorization.idToken} is not scoped to station ${context.stationId} — denying (NotAtThisLocation)`,
    );
    return AuthorizationStatusEnum.NotAtThisLocation;
  }
}
