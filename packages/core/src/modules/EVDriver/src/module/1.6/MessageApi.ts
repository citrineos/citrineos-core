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
  OCPPVersion,
  OCPP_CallAction,
} from '@citrineos/base';
import { v4 as uuidv4 } from 'uuid';

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
  }

  protected get supportedVersions(): OCPPVersion[] {
    return [OCPPVersion.OCPP1_6];
  }

  @AsMessageEndpoint(
    OCPP_CallAction.RemoteStartTransaction,
    OCPP1_6.RemoteStartTransactionRequestSchema,
  )
  async remoteStartTransaction(
    identifier: string[],
    request: OCPP1_6.RemoteStartTransactionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.RemoteStartTransaction,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP_CallAction.RemoteStopTransaction,
    OCPP1_6.RemoteStopTransactionRequestSchema,
  )
  async remoteStopTransaction(
    identifier: string[],
    request: OCPP1_6.RemoteStopTransactionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.RemoteStopTransaction,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP_CallAction.UnlockConnector, OCPP1_6.UnlockConnectorRequestSchema)
  async unlockConnector(
    identifier: string[],
    request: OCPP1_6.UnlockConnectorRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.UnlockConnector,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP_CallAction.ClearCache, OCPP1_6.ClearCacheRequestSchema)
  async clearCache(
    identifier: string[],
    request: OCPP1_6.ClearCacheRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.ClearCache,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP_CallAction.SendLocalList, OCPP1_6.SendLocalListRequestSchema)
  async sendLocalList(
    identifier: string[],
    request: OCPP1_6.SendLocalListRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const i of identifier) {
      try {
        const correlationId = uuidv4();

        await this._module.localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest16(
          tenantId,
          i,
          correlationId,
          request,
        );

        const confirmation = await this._module.sendCall(
          i,
          tenantId,
          OCPPVersion.OCPP1_6,
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

  @AsMessageEndpoint(OCPP_CallAction.GetLocalListVersion, OCPP1_6.GetLocalListVersionRequestSchema)
  async getLocalListVersion(
    identifier: string[],
    request: OCPP1_6.GetLocalListVersionRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.GetLocalListVersion,
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
  protected _toMessagePath(input: CallAction, version?: OCPPVersion | null): string {
    const endpointPrefix = this._module.config.modules.evdriver.endpointPrefix;
    return super._toMessagePath(input, version, endpointPrefix);
  }
}
