// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IEVDriverModuleApi } from '../interface.js';
import { EVDriverModule } from '../module.js';
import type { CallAction, IMessageConfirmation } from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPP2_0_1,
  OCPPVersion,
} from '@citrineos/base';
import { OCPP1_6_Mapper } from '@citrineos/data';

export class EVDriverOcpp16Api
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
  constructor(evDriverModule: EVDriverModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
    super(evDriverModule, server, OCPPVersion.OCPP1_6, logger);
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.RemoteStartTransaction,
    OCPP1_6.RemoteStartTransactionRequestSchema,
  )
  async remoteStartTransaction(
    identifier: string[],
    request: OCPP1_6.RemoteStartTransactionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return Promise.all(
      identifier.map(async (id) => {
        if (request.chargingProfile) {
          const mapped = OCPP1_6_Mapper.ChargingProfileMapper.remoteStartToChargingProfileType(
            request.chargingProfile,
          );

          // Save the charging profile, set the source to "CSO"
          await this._module.chargingProfileRepository.createOrUpdateChargingProfile(
            tenantId,
            mapped,
            id,
            request.connectorId ?? null,
            OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
          );
        }

        return this._module.sendCall(
          id,
          tenantId,
          OCPPVersion.OCPP1_6,
          OCPP1_6_CallAction.RemoteStartTransaction,
          request,
          callbackUrl,
        );
      }),
    );
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.RemoteStopTransaction,
    OCPP1_6.RemoteStopTransactionRequestSchema,
  )
  async remoteStopTransaction(
    identifier: string[],
    request: OCPP1_6.RemoteStopTransactionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.RemoteStopTransaction,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP1_6_CallAction.UnlockConnector, OCPP1_6.UnlockConnectorRequestSchema)
  async unlockConnector(
    identifier: string[],
    request: OCPP1_6.UnlockConnectorRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.UnlockConnector,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP1_6_CallAction.ClearCache, OCPP1_6.ClearCacheRequestSchema)
  async clearCache(
    identifier: string[],
    request: OCPP1_6.ClearCacheRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.ClearCache,
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
}
