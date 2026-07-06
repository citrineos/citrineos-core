// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, IMessageConfirmation } from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';
import type { IConfigurationModuleApi } from '../interface.js';
import { ConfigurationModule } from '../module.js';

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
  constructor({
    configurationModule,
    server,
    logger,
  }: {
    configurationModule: ConfigurationModule;
    server: FastifyInstance;
    logger?: Logger<ILogObj>;
  }) {
    super(configurationModule, server, logger);
  }

  protected get supportedVersions(): OCPPVersion[] {
    return [OCPPVersion.OCPP1_6];
  }

  @AsMessageEndpoint(OCPP_CallAction.TriggerMessage, OCPP1_6.TriggerMessageRequestSchema)
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

    const results: Promise<IMessageConfirmation>[] = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.TriggerMessage,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP_CallAction.ChangeConfiguration, OCPP1_6.ChangeConfigurationRequestSchema)
  async changeConfiguration(
    identifier: string[],
    request: OCPP1_6.ChangeConfigurationRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    this._logger.debug('ChangeConfiguration request received:', request);
    const confirmations = identifier.map(async (ocppConnectionName) => {
      const chargingStation = await this._module.locationRepository.readChargingStationByStationId(
        tenantId,
        ocppConnectionName,
      );
      if (!chargingStation) {
        return {
          success: false,
          payload: `Charging station ${ocppConnectionName} not found`,
        };
      }

      return await this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.ChangeConfiguration,
        request,
        callbackUrl,
      );
    });

    return Promise.all(confirmations);
  }

  @AsMessageEndpoint(OCPP_CallAction.GetConfiguration, OCPP1_6.GetConfigurationRequestSchema)
  async getConfiguration(
    identifier: string[],
    request: OCPP1_6.GetConfigurationRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    this._logger.debug('GetConfiguration request received:', request);

    const confirmations: IMessageConfirmation[] = [];

    await Promise.all(
      identifier.map(async (ocppConnectionName) => {
        const chargingStation =
          await this._module.locationRepository.readChargingStationByStationId(
            tenantId,
            ocppConnectionName,
          );
        if (!chargingStation) {
          confirmations.push({
            success: false,
            payload: {
              batch: `Station ${ocppConnectionName}`,
              message: `Charging station ${ocppConnectionName} not found`,
              ocppConnectionName,
            },
          });
          return;
        }

        const maxKeysConfig = await this._module.changeConfigurationRepository.readOnlyOneByQuery(
          tenantId,
          {
            where: {
              tenantId: tenantId,
              ocppConnectionName: ocppConnectionName,
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
                  ocppConnectionName,
                  tenantId,
                  OCPPVersion.OCPP1_6,
                  OCPP_CallAction.GetConfiguration,
                  { key: batch },
                  callbackUrl,
                  correlationId,
                );

                confirmations.push({
                  success: batchResult.success,
                  payload: {
                    batch: `[${index}:${index + batch.length}]`,
                    message: `${batchResult.payload}`,
                    ocppConnectionName,
                  },
                });
              } catch (error) {
                confirmations.push({
                  success: false,
                  payload: {
                    batch: `[${index}:${index + batch.length}]`,
                    message: `${error}`,
                    ocppConnectionName,
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

  @AsMessageEndpoint(OCPP_CallAction.Reset, OCPP1_6.ResetRequestSchema)
  reset(
    identifier: string[],
    request: OCPP1_6.ResetRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.Reset,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP_CallAction.ChangeAvailability, OCPP1_6.ChangeAvailabilityRequestSchema)
  changeAvailability(
    identifier: string[],
    request: OCPP1_6.ChangeAvailabilityRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.ChangeAvailability,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP_CallAction.UpdateFirmware, OCPP1_6.UpdateFirmwareRequestSchema)
  updateFirmware(
    identifier: string[],
    request: OCPP1_6.UpdateFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.UpdateFirmware,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP_CallAction.SignedUpdateFirmware,
    OCPP1_6.SignedUpdateFirmwareRequestSchema,
  )
  signedUpdateFirmware(
    identifier: string[],
    request: OCPP1_6.SignedUpdateFirmwareRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.SignedUpdateFirmware,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP_CallAction.DataTransfer, OCPP1_6.DataTransferRequestSchema)
  dataTransfer(
    identifier: string[],
    request: OCPP1_6.DataTransferRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((ocppConnectionName) =>
      this._module.sendCall(
        ocppConnectionName,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.DataTransfer,
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
  protected _toMessagePath(input: CallAction, version?: OCPPVersion | null): string {
    const endpointPrefix = this._module.config.modules.configuration.endpointPrefix;
    return super._toMessagePath(input, version, endpointPrefix);
  }
}
