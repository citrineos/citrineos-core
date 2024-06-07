// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import { ISmartChargingModuleApi } from './interface';
import { SmartChargingModule } from './module';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  AttributeEnumType,
  CallAction,
  ChargingLimitSourceEnumType,
  ChargingProfileKindEnumType,
  ChargingProfilePurposeEnumType,
  ChargingProfileType,
  ClearChargingProfileRequest,
  ClearChargingProfileRequestSchema,
  ClearedChargingLimitRequestSchema,
  CustomerInformationRequest,
  GetChargingProfilesRequest,
  GetChargingProfilesRequestSchema,
  GetCompositeScheduleRequest,
  GetCompositeScheduleRequestSchema,
  IMessageConfirmation,
  Namespace,
  SetChargingProfileRequest,
  SetChargingProfileRequestSchema,
} from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { VariableAttribute } from '@citrineos/data';
import { getNumberOfFractionDigit } from '@citrineos/util/dist/util/parser';

/**
 * Server API for the SmartCharging module.
 */
export class SmartChargingModuleApi
  extends AbstractModuleApi<SmartChargingModule>
  implements ISmartChargingModuleApi {
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
    super(smartChargingModule, server, logger);
  }

  /**
   * Message endpoints
   */
  @AsMessageEndpoint(
    CallAction.ClearChargingProfile,
    ClearChargingProfileRequestSchema,
  )
  async clearChargingProfile(
    identifier: string,
    tenantId: string,
    request: ClearChargingProfileRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    if (!request.chargingProfileId && !request.chargingProfileCriteria) {
      return {
        success: false,
        payload: 'Either chargingProfileId or chargingProfileCriteria must be provided',
      };
    }
    if (request.chargingProfileCriteria?.chargingProfilePurpose === ChargingProfilePurposeEnumType.ChargingStationExternalConstraints) {
        return {
            success: false,
            payload: 'The CSMS SHALL NOT set chargingProfilePurpose to ChargingStationExternalConstraints.',
        };
    }

    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.ClearChargingProfile,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
      CallAction.GetChargingProfiles,
      GetChargingProfilesRequestSchema,
  )
  async getChargingProfile(
      identifier: string,
      tenantId: string,
      request: GetChargingProfilesRequest,
      callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    if (request.chargingProfile.chargingProfileId && request.chargingProfile.chargingProfileId.length > 1) {
      const variableCharacteristics = await this._module.deviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance('Entries', 'ChargingProfiles');
      if (variableCharacteristics && variableCharacteristics.maxLimit && request.chargingProfile.chargingProfileId.length > variableCharacteristics.maxLimit) {
        return {
          success: false,
          payload: `The max length of chargingProfileId is ${variableCharacteristics.maxLimit}`,
        };
      }
    }

    return this._module.sendCall(
        identifier,
        tenantId,
        CallAction.GetChargingProfiles,
        request,
        callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.SetChargingProfile,
    SetChargingProfileRequestSchema,
  )
  async setChargingProfile(
    identifier: string,
    tenantId: string,
    request: SetChargingProfileRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    this._logger.info(
      `Received SetChargingProfile: ${JSON.stringify(request)}`,
    );

    const chargingProfile: ChargingProfileType = request.chargingProfile;

    // Validate Charging Profile Stack Level
    if (chargingProfile.stackLevel < 0) {
      return {
        success: false,
        payload: 'Stack Level SHALL be >= 0.',
      };
    }

    // Validate Charging Profile valid period
    const now = new Date();
    const validFrom = chargingProfile.validFrom
      ? new Date(chargingProfile.validFrom)
      : null;
    const validTo = chargingProfile.validTo
      ? new Date(chargingProfile.validTo)
      : null;
    // OCPP 2.0.1 Part 2 K01.FR.36
    if (validFrom && validFrom.getTime() > now.getTime()) {
      return {
        success: false,
        payload: `chargingProfile validFrom ${chargingProfile.validFrom} should not be in the future.`,
      };
    }
    // OCPP 2.0.1 Part 2 K01.FR.37
    if (validTo && validTo.getTime() <= now.getTime()) {
      return {
        success: false,
        payload: `chargingProfile validTo ${chargingProfile.validTo} should be in the future.`,
      };
    }

    // Validate Charging Profile Purpose
    let receivedChargingNeeds;
    if (
      chargingProfile.chargingProfilePurpose ===
      ChargingProfilePurposeEnumType.TxProfile
    ) {
      if (!chargingProfile.transactionId) {
        return {
          success: false,
          payload:
            'Missing transactionId for chargingProfilePurpose TxProfile.',
        };
      }
      if (
        !(await this._module.transactionEventRepository.readTransactionByStationIdAndTransactionId(
          identifier,
          chargingProfile.transactionId,
        ))
      ) {
        return {
          success: false,
          payload: `Transaction ${chargingProfile.transactionId} not found on station ${identifier}.`,
        };
      }
      if (request.evseId <= 0) {
        return {
          success: false,
          payload: 'TxProfile SHALL only be be used with evseId >0.',
        };
      }

      const transaction =
        await this._module.transactionEventRepository.readTransactionByStationIdAndTransactionId(
          identifier,
          chargingProfile.transactionId,
        );
      if (!transaction) {
        return {
          success: false,
          payload: `Transaction ${chargingProfile.transactionId} not found on station ${identifier}.`,
        };
      }
      // OCPP 2.0.1 Part 2 K01.FR.34
      const evse =
        await this._module.deviceModelRepository.findEvseByIdAndConnectorId(
          request.evseId,
          null,
        );
      if (!evse) {
        return {
          success: false,
          payload: `Evse ${request.evseId} not found.`,
        };
      }
      this._logger.info(`Found evse: ${JSON.stringify(evse)}`);
      receivedChargingNeeds =
        await this._module.chargingProfileRepository.findChargingNeedsByEvseDBIdAndTransactionDBId(
          evse.databaseId,
          transaction.id,
        );
      if (
        !receivedChargingNeeds &&
        chargingProfile.chargingSchedule.length > 1
      ) {
        return {
          success: false,
          payload: `The CSMS has not received a NotifyEVChargingNeedsReq set for the current transaction ${transaction.id}. ChargingProfile SHALL contain only one ChargingScheduleType.`,
        };
      }
      // OCPP 2.0.1 Part 2 K01.FR.39
      const numOfExistedChargingProfile =
        await this._module.chargingProfileRepository.existByQuery({
          stackLevel: chargingProfile.stackLevel,
          transactionDatabaseId: transaction.id,
          chargingProfilePurpose: chargingProfile.chargingProfilePurpose,
          isActive: true,
        });
      if (numOfExistedChargingProfile > 0) {
        return {
          success: false,
          payload: `${numOfExistedChargingProfile} ChargingProfile with stackLevel ${chargingProfile.stackLevel} and transactionId ${chargingProfile.transactionId} already exists.`,
        };
      }
    } else if (
      chargingProfile.chargingProfilePurpose ===
      ChargingProfilePurposeEnumType.ChargingStationExternalConstraints
    ) {
      return {
        success: false,
        payload:
          'The CSMS SHALL NOT set chargingProfilePurpose to' +
          ' ChargingStationExternalConstraints. This purpose is only used when an external system has set a charging limit/schedule.',
      };
    } else {
      if (
        chargingProfile.chargingProfilePurpose ===
        ChargingProfilePurposeEnumType.ChargingStationMaxProfile
      ) {
        if (
          chargingProfile.chargingProfileKind ===
          ChargingProfileKindEnumType.Relative
        ) {
          return {
            success: false,
            payload:
              'When chargingProfilePurpose is ChargingStationMaxProfile,' +
              ' chargingProfileKind SHALL NOT be Relative',
          };
        }
        if (request.evseId !== 0) {
          return {
            success: false,
            payload:
              'When chargingProfilePurpose is ChargingStationMaxProfile,' +
              ' evseId SHALL be 0',
          };
        }
      }
      // OCPP 2.0.1 Part 2 K01.FR.06
      const existedChargingProfiles =
        await this._module.chargingProfileRepository.readAllByQuery({
          where: {
            stackLevel: chargingProfile.stackLevel,
            chargingProfilePurpose: chargingProfile.chargingProfilePurpose,
            evseId: request.evseId,
            isActive: true,
          },
        });
      this._logger.info(
        `Found existed charging profiles: ${JSON.stringify(existedChargingProfiles)}`,
      );
      if (existedChargingProfiles.length > 0) {
        // validFrom must be smaller than or equal to the time when it is set on charger
        // So no need to check validFrom
        if (!validTo) {
          return {
            success: false,
            payload:
              'No two charging profiles with same stack level and purpose can be valid at the same time.',
          };
        } else {
          for (const existedProfile of existedChargingProfiles) {
            const existedValidTo = existedProfile.validTo
              ? new Date(existedProfile.validTo)
              : null;
            if (
              !existedValidTo ||
              existedValidTo.getTime() >= validTo.getTime()
            ) {
              return {
                success: false,
                payload:
                  'No two charging profiles with same stack level and purpose can be valid at the same time.',
              };
            }
          }
        }
      }
    }

    // Validate Charging Schedules
    const acPhaseSwitchingSupported: VariableAttribute[] =
      await this._module.deviceModelRepository.readAllByQuery({
        stationId: identifier,
        component_evse_id: request.evseId,
        component_name: 'SmartChargingCtrlr',
        variable_name: 'ACPhaseSwitchingSupported',
        type: AttributeEnumType.Actual,
      });
    this._logger.info(
      `Found ACPhaseSwitchingSupported: ${JSON.stringify(acPhaseSwitchingSupported)}`,
    );
    const periodsPerSchedules: VariableAttribute[] =
      await this._module.deviceModelRepository.readAllByQuery({
        stationId: identifier,
        component_name: 'SmartChargingCtrlr',
        variable_name: 'PeriodsPerSchedule',
        type: AttributeEnumType.Actual,
      });
    this._logger.info(
      `Found PeriodsPerSchedule: ${JSON.stringify(periodsPerSchedules)}`,
    );
    let periodsPerSchedule;
    if (periodsPerSchedules.length > 0 && periodsPerSchedules[0].value) {
      periodsPerSchedule = Number(periodsPerSchedules[0].value);
    }
    for (const chargingSchedule of chargingProfile.chargingSchedule) {
      if (
        chargingSchedule.minChargingRate &&
        getNumberOfFractionDigit(chargingSchedule.minChargingRate) > 1
      ) {
        return {
          success: false,
          payload: `chargingSchedule ${chargingSchedule.id}: minChargingRate accepts at most one digit fraction (e.g. 8.1).`,
        };
      }

      if (chargingSchedule.chargingSchedulePeriod[0].startPeriod !== 0) {
        return {
          success: false,
          payload: `ChargingSchedule ${chargingSchedule.id}: The startPeriod of the first chargingSchedulePeriod in a chargingSchedule SHALL always be 0.`,
        };
      }

      if (
        chargingProfile.chargingProfileKind ===
          ChargingProfileKindEnumType.Absolute ||
        chargingProfile.chargingProfileKind ===
          ChargingProfileKindEnumType.Recurring
      ) {
        // OCPP 2.0.1 Part 2 K01.FR.40
        if (!chargingSchedule.startSchedule) {
          return {
            success: false,
            payload: `ChargingSchedule ${chargingSchedule.id}: startSchedule SHALL be set when chargingProfileKind is Absolute or Recurring.`,
          };
        }
      } else if (
        chargingProfile.chargingProfileKind ===
        ChargingProfileKindEnumType.Relative
      ) {
        // OCPP 2.0.1 Part 2 K01.FR.41
        if (chargingSchedule.startSchedule) {
          return {
            success: false,
            payload: `ChargingSchedule ${chargingSchedule.id}: startSchedule SHALL be absent when chargingProfileKind is Relative.`,
          };
        }
      }

      if (
        periodsPerSchedule &&
        chargingSchedule.chargingSchedulePeriod.length > periodsPerSchedule
      ) {
        return {
          success: false,
          payload: `ChargingSchedule ${chargingSchedule.id}: The number of chargingSchedulePeriod SHALL not exceed ${periodsPerSchedule}.`,
        };
      }

      chargingSchedule.chargingSchedulePeriod.sort((period1, period2) => {
        if (period1.startPeriod > period2.startPeriod) {
          return 1;
        }
        if (period1.startPeriod < period2.startPeriod) {
          return -1;
        }
        return 0;
      });

      for (const chargingSchedulePeriod of chargingSchedule.chargingSchedulePeriod) {
        if (chargingSchedulePeriod.phaseToUse) {
          // OCPP 2.0.1 Part 2 K01.FR.19
          if (chargingSchedulePeriod.numberPhases !== 1) {
            return {
              success: false,
              payload: `ChargingSchedule ${chargingSchedule.id}: PhaseToUse SHALL only be set with numberPhases = 1.`,
            };
          }
          // OCPP 2.0.1 Part 2 K01.FR.20
          if (
            acPhaseSwitchingSupported.length === 0 ||
            !acPhaseSwitchingSupported[0].value
          ) {
            return {
              success: false,
              payload: `ChargingSchedule ${chargingSchedule.id}: PhaseToUse SHALL only be set if ACPhaseSwitchingSupported is defined and true.`,
            };
          }
        }

        if (getNumberOfFractionDigit(chargingSchedulePeriod.limit) > 1) {
          return {
            success: false,
            payload: `ChargingSchedule ${chargingSchedule.id}: chargingSchedulePeriod limit accepts at most one digit fraction (e.g. 8.1).`,
          };
        }
      }

      if (chargingSchedule.salesTariff) {
        if (
          receivedChargingNeeds &&
          receivedChargingNeeds.maxScheduleTuples &&
          chargingSchedule.salesTariff.salesTariffEntry.length >
            receivedChargingNeeds.maxScheduleTuples
        ) {
          return {
            success: false,
            payload: `ChargingSchedule ${chargingSchedule.id}: The number of SalesTariffEntry elements (${chargingSchedule.salesTariff.salesTariffEntry.length}) SHALL not exceed maxScheduleTuples (${receivedChargingNeeds.maxScheduleTuples}).`,
          };
        }

        for (const salesTariffEntry of chargingSchedule.salesTariff
          .salesTariffEntry) {
          if (salesTariffEntry.consumptionCost) {
            for (const consumptionCost of salesTariffEntry.consumptionCost) {
              if (consumptionCost.cost) {
                for (const cost of consumptionCost.cost) {
                  if (
                    cost.amountMultiplier &&
                    (cost.amountMultiplier > 3 || cost.amountMultiplier < -3)
                  ) {
                    return {
                      success: false,
                      payload: `ChargingSchedule ${chargingSchedule.id}: amountMultiplier SHALL be in [-3, 3].`,
                    };
                  }
                }
              }
            }
          }
        }
      }
    }

    await this._module.chargingProfileRepository.createOrUpdateChargingProfile(
      chargingProfile,
      identifier,
      request.evseId,
      ChargingLimitSourceEnumType.CSO,
    );

    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.SetChargingProfile,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.ClearedChargingLimit,
    ClearedChargingLimitRequestSchema,
  )
  clearedChargingLimit(
    identifier: string,
    tenantId: string,
    request: CustomerInformationRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.ClearedChargingLimit,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.GetCompositeSchedule,
    GetCompositeScheduleRequestSchema,
  )
  getCompositeSchedule(
    identifier: string,
    tenantId: string,
    request: GetCompositeScheduleRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.GetCompositeSchedule,
      request,
      callbackUrl,
    );
  }

  /**
   * Data endpoints
   */

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix =
      this._module.config.modules.smartcharging?.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix =
      this._module.config.modules.smartcharging?.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
