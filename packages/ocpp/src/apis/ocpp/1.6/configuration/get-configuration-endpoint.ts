// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointMetadata,
  type IOcppSender,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { IChangeConfigurationRepository, IChargingStationRepository } from '@citrineos/dal';
import { v4 as uuidv4 } from 'uuid';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  locationRepository: IChargingStationRepository;
  changeConfigurationRepository: IChangeConfigurationRepository;
}

export class GetConfigurationEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.GetConfiguration,
    protocols: [OCPPVersion.OCPP1_6],
    eventGroup: EventGroup.Configuration,
    bodySchema: () => OCPP1_6.GetConfigurationRequestSchema,
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _locationRepository: IChargingStationRepository;
  private readonly _changeConfigurationRepository: IChangeConfigurationRepository;

  constructor({
    logger,
    ocppSender,
    locationRepository,
    changeConfigurationRepository,
  }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._locationRepository = locationRepository;
    this._changeConfigurationRepository = changeConfigurationRepository;
  }

  async handle(
    identifiers: string[],
    request: OCPP1_6.GetConfigurationRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    this._logger.debug('GetConfiguration request received:', request);

    const confirmations: IMessageConfirmation[] = [];

    await Promise.all(
      identifiers.map(async (ocppConnectionName) => {
        const chargingStation = await this._locationRepository.readChargingStationByStationId(
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

        const maxKeys = await this._readMaxKeys(tenantId, ocppConnectionName);
        const keys = request.key ?? [];
        const batches =
          keys.length === 0 || keys.length <= maxKeys ? [keys] : this._splitKeys(keys, maxKeys);

        await Promise.all(
          batches.map(async (batch, index) => {
            try {
              const batchResult = await this._ocppSender.sendCall({
                ocppConnectionName,
                tenantId,
                protocol: OCPPVersion.OCPP1_6,
                action: OCPP_CallAction.GetConfiguration,
                eventGroup: EventGroup.Configuration,
                payload: { key: batch },
                callbackUrl,
                correlationId: uuidv4(),
              });

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
      }),
    );

    return confirmations;
  }

  private async _readMaxKeys(tenantId: number, ocppConnectionName: string): Promise<number> {
    const maxKeysConfig = await this._changeConfigurationRepository.findByStationAndKey(
      tenantId,
      ocppConnectionName,
      'GetConfigurationMaxKeys',
    );
    return maxKeysConfig?.value ? parseInt(maxKeysConfig.value, 10) : Number.MAX_SAFE_INTEGER;
  }

  private _splitKeys(keys: string[], maxKeys: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < keys.length; i += maxKeys) {
      batches.push(keys.slice(i, i + maxKeys));
    }
    return batches;
  }
}
