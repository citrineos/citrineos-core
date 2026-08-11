// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type ICache,
  type IMessageConfirmation,
  type IMessageEndpointDeclaration,
  type IOcppSender,
  AbstractMessageEndpoint,
  CacheNamespace,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import {
  ChargingProfilePurposeEnum,
  EventGroup,
  OCPPVersion,
  OCPP_CallAction,
  type OCPP2_1,
  type OCPP2_request_types,
} from '@citrineos/types';
import type {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import { OCPP2_0_1_Mapper } from '@dal/index.js';
import { validateChargingProfileType } from '@util/index.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

const TRANSACTION_LIMIT_CACHE_SECONDS = 300;

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  cache: ICache;
  deviceModelRepository: IDeviceModelRepository;
  chargingProfileRepository: IChargingProfileRepository;
  transactionEventRepository: ITransactionEventRepository;
}

export class RequestStartTransactionEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.RequestStartTransaction,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.EVDriver,
    bodySchema: ocpp2Schema('RequestStartTransactionRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _cache: ICache;
  private readonly _deviceModelRepository: IDeviceModelRepository;
  private readonly _chargingProfileRepository: IChargingProfileRepository;
  private readonly _transactionEventRepository: ITransactionEventRepository;

  constructor({
    logger,
    ocppSender,
    cache,
    deviceModelRepository,
    chargingProfileRepository,
    transactionEventRepository,
  }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._cache = cache;
    this._deviceModelRepository = deviceModelRepository;
    this._chargingProfileRepository = chargingProfileRepository;
    this._transactionEventRepository = transactionEventRepository;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.RequestStartTransactionRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      let payloadMessage: string | undefined;

      const transactionLimit = request.customData?.transactionLimit;
      if (version === OCPPVersion.OCPP2_1 && transactionLimit) {
        await this._cacheTransactionLimit(
          tenantId,
          ocppConnectionName,
          request.remoteStartId,
          transactionLimit,
        );
      }

      if (request.chargingProfile) {
        const chargingProfile = { ...request.chargingProfile };

        if (chargingProfile.chargingProfilePurpose !== ChargingProfilePurposeEnum.TxProfile) {
          results.push({
            success: false,
            payload: 'The Purpose of the ChargingProfile SHALL always be TxProfile.',
          });
          continue;
        }

        if (chargingProfile.transactionId) {
          chargingProfile.transactionId = undefined;
          this._logger.warn(
            `A transactionId cannot be provided in the ChargingProfile for station: ${ocppConnectionName}`,
          );
        }

        try {
          await validateChargingProfileType(
            chargingProfile,
            tenantId,
            ocppConnectionName,
            this._deviceModelRepository,
            this._chargingProfileRepository,
            this._transactionEventRepository,
            this._logger,
            request.evseId,
          );

          const smartChargingEnabled = await this._deviceModelRepository.readAllByQuerystring(
            tenantId,
            {
              component_name: 'SmartChargingCtrlr',
              variable_name: 'Enabled',
              tenantId,
              ocppConnectionName,
            },
          );

          if (smartChargingEnabled.length > 0 && smartChargingEnabled[0].value === 'false') {
            payloadMessage = `SmartCharging is not enabled on charger ${ocppConnectionName}. The charging profile will be ignored.`;
            this._logger.warn(payloadMessage);
          } else {
            await this._chargingProfileRepository.createOrUpdateChargingProfile(
              tenantId,
              OCPP2_0_1_Mapper.ChargingProfileMapper.fromChargingProfileType(chargingProfile),
              ocppConnectionName,
              request.evseId,
            );
          }
        } catch (error) {
          results.push({
            success: false,
            payload: error instanceof Error ? error.message : JSON.stringify(error),
          });
          continue;
        }
      }

      try {
        const confirmation = await this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: version,
          action: OCPP_CallAction.RequestStartTransaction,
          eventGroup: EventGroup.EVDriver,
          payload: request,
          callbackUrl,
        });

        results.push(payloadMessage ? { success: true, payload: payloadMessage } : confirmation);
      } catch (error) {
        results.push({
          success: false,
          payload: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return results;
  }

  private async _cacheTransactionLimit(
    tenantId: number,
    ocppConnectionName: string,
    remoteStartId: number,
    transactionLimit: OCPP2_1.TransactionLimitType,
  ): Promise<void> {
    try {
      await this._cache.set(
        `remotestart:${tenantId}:${ocppConnectionName}:${remoteStartId}`,
        JSON.stringify(transactionLimit),
        CacheNamespace.Other,
        TRANSACTION_LIMIT_CACHE_SECONDS,
      );

      this._logger.info(
        `Stored transactionLimit for RequestStartTransaction on station ${ocppConnectionName}, ` +
          `remoteStartId=${remoteStartId}: ` +
          `maxCost=${transactionLimit.maxCost}, maxEnergy=${transactionLimit.maxEnergy}, ` +
          `maxTime=${transactionLimit.maxTime}, maxSoC=${transactionLimit.maxSoC}`,
      );
    } catch (error) {
      this._logger.error(
        `Failed to store transactionLimit for remoteStartId ${remoteStartId}`,
        error,
      );
    }
  }
}
