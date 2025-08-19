// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IConfigurationModuleApi } from '../interface';
import { ConfigurationModule } from '../module';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  DEFAULT_TENANT_ID,
  IMessageConfirmation,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { v4 as uuidv4 } from 'uuid';

/**
 * Server API for the Configuration component.
 */
export class ConfigurationOcpp16Api
  extends AbstractModuleApi<ConfigurationModule>
  implements IConfigurationModuleApi
{
  /**
   * Constructor for the class.
   *
   * @param {ConfigurationModule} ConfigurationComponent - The Configuration component.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - Optional logger instance.
   */
  constructor(
    ConfigurationComponent: ConfigurationModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(ConfigurationComponent, server, OCPPVersion.OCPP1_6, logger);
  }

  @AsMessageEndpoint(OCPP1_6_CallAction.TriggerMessage, OCPP1_6.TriggerMessageRequestSchema)
  async triggerMessage(
    identifier: string[],
    request: OCPP1_6.TriggerMessageRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const connectorId = request.connectorId;
    if (connectorId && connectorId <= 0) {
      const errorMsg: string = `connectorId should be either omitted or greater than 0.`;
      this._logger.error(errorMsg);
      return [{ success: false, payload: errorMsg }];
    }

    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP2_0_1_CallAction.TriggerMessage,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP1_6_CallAction.ChangeConfiguration,
    OCPP1_6.ChangeConfigurationRequestSchema,
  )
  async changeConfiguration(
    identifier: string[],
    request: OCPP1_6.ChangeConfigurationRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    this._logger.debug('ChangeConfiguration request received:', request);
    const confirmations = identifier.map(async (stationId) => {
      const chargingStation = await this._module.locationRepository.readChargingStationByStationId(
        tenantId,
        stationId,
      );
      if (!chargingStation) {
        return {
          success: false,
          payload: `Charging station ${stationId} not found`,
        };
      }

      return await this._module.sendCall(
        stationId,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.ChangeConfiguration,
        request,
        callbackUrl,
      );
    });

    return Promise.all(confirmations);
  }

  @AsMessageEndpoint(OCPP1_6_CallAction.GetConfiguration, OCPP1_6.GetConfigurationRequestSchema)
  async getConfiguration(
    identifier: string[],
    request: OCPP1_6.GetConfigurationRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    this._logger.debug('GetConfiguration request received:', request);

    const confirmations: IMessageConfirmation[] = [];

    await Promise.all(
      identifier.map(async (stationId) => {
        const chargingStation =
          await this._module.locationRepository.readChargingStationByStationId(tenantId, stationId);
        if (!chargingStation) {
          confirmations.push({
            success: false,
            payload: {
              batch: `Station ${stationId}`,
              message: `Charging station ${stationId} not found`,
              stationId,
            },
          });
          return;
        }

        const maxKeysConfig = await this._module.changeConfigurationRepository.readOnlyOneByQuery(
          tenantId,
          {
            where: {
              tenantId: tenantId,
              stationId: stationId,
              key: 'GetConfigurationMaxKeys',
            },
          },
        );
        const maxKeys = maxKeysConfig?.value
          ? parseInt(maxKeysConfig.value, 10)
          : Number.MAX_SAFE_INTEGER;
        const keys = request.key || [];

        const sendBatches = async (batches: string[][]) => {
          return Promise.all(
            batches.map(async (batch, index) => {
              try {
                const correlationId = uuidv4();
                const batchResult = await this._module.sendCall(
                  stationId,
                  tenantId,
                  OCPPVersion.OCPP1_6,
                  OCPP1_6_CallAction.GetConfiguration,
                  { key: batch },
                  callbackUrl,
                  correlationId,
                );

                confirmations.push({
                  success: batchResult.success,
                  payload: {
                    batch: `[${index}:${index + batch.length}]`,
                    message: `${batchResult.payload}`,
                    stationId,
                  },
                });
              } catch (error) {
                confirmations.push({
                  success: false,
                  payload: {
                    batch: `[${index}:${index + batch.length}]`,
                    message: `${error}`,
                    stationId,
                  },
                });
              }
            }),
          );
        };

        if (keys.length === 0 || keys.length <= maxKeys) {
          await sendBatches([keys]);
        } else {
          const batches = [];
          for (let i = 0; i < keys.length; i += maxKeys) {
            batches.push(keys.slice(i, i + maxKeys));
          }
          await sendBatches(batches);
        }
      }),
    );

    return confirmations;
  }

  @AsMessageEndpoint(OCPP1_6_CallAction.Reset, OCPP1_6.ResetRequestSchema)
  reset(
    identifier: string[],
    request: OCPP1_6.ResetRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.Reset,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP1_6_CallAction.ChangeAvailability, OCPP1_6.ChangeAvailabilityRequestSchema)
  changeAvailability(
    identifier: string[],
    request: OCPP1_6.ChangeAvailabilityRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.ChangeAvailability,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP1_6_CallAction.UpdateFirmware, OCPP1_6.UpdateFirmwareRequestSchema)
  updateFirmware(
    identifier: string[],
    request: OCPP1_6.UpdateFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP1_6_CallAction.UpdateFirmware,
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
    const endpointPrefix = this._module.config.modules.configuration.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
