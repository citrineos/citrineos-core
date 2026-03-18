// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ISmartChargingModuleApi } from '../interface.js';
import { SmartChargingModule } from '../module.js';
import type { CallAction, IMessageConfirmation } from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import type { FastifyInstance } from 'fastify';

/**
 * Server API for the OCPP 1.6 SmartCharging module.
 */
export class SmartChargingOcpp16Api
  extends AbstractModuleApi<SmartChargingModule>
  implements ISmartChargingModuleApi
{
  /**
   * Constructs a new instance of the class.
   *
   * @param {SmartChargingModule} smartChargingModule - The SmartCharging module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(
    smartChargingModule: SmartChargingModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(smartChargingModule, server, OCPPVersion.OCPP1_6, logger);
  }

  @AsMessageEndpoint(OCPP1_6_CallAction.SetChargingProfile, OCPP1_6.SetChargingProfileRequestSchema)
  setChargingProfile(
    identifier: string[],
    request: OCPP1_6.SetChargingProfileRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return Promise.all(
      identifier.map((id) =>
        this._module.sendCall(
          id,
          tenantId,
          OCPPVersion.OCPP1_6,
          OCPP1_6_CallAction.SetChargingProfile,
          request,
          callbackUrl,
        ),
      ),
    );
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.ClearChargingProfile,
    OCPP1_6.ClearChargingProfileRequestSchema,
  )
  clearChargingProfile(
    identifier: string[],
    request: OCPP1_6.ClearChargingProfileRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return Promise.all(
      identifier.map((id) =>
        this._module.sendCall(
          id,
          tenantId,
          OCPPVersion.OCPP1_6,
          OCPP1_6_CallAction.ClearChargingProfile,
          request,
          callbackUrl,
        ),
      ),
    );
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.GetCompositeSchedule,
    OCPP1_6.GetCompositeScheduleRequestSchema,
  )
  getCompositeSchedule(
    identifier: string[],
    request: OCPP1_6.GetCompositeScheduleRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return Promise.all(
      identifier.map((id) =>
        this._module.sendCall(
          id,
          tenantId,
          OCPPVersion.OCPP1_6,
          OCPP1_6_CallAction.GetCompositeSchedule,
          request,
          callbackUrl,
        ),
      ),
    );
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.smartcharging?.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
