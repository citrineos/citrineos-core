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
import { validateChargingProfileType } from '@citrineos/util/dist/util/validator';
import { stringToSet } from "@citrineos/util/dist/util/parser";

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
  clearChargingProfile(
    identifier: string,
    tenantId: string,
    request: ClearChargingProfileRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
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
  getChargingProfile(
    identifier: string,
    tenantId: string,
    request: GetChargingProfilesRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
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
    // Validate ChargingProfileType's constraints
    try {
      await validateChargingProfileType(
        chargingProfile,
        identifier,
        this._module.deviceModelRepository,
        this._module.chargingProfileRepository,
        this._module.transactionEventRepository,
        this._logger,
        request.evseId,
      );
    } catch (error) {
      return {
        success: false,
        payload: error instanceof Error ? error.message : JSON.stringify(error),
      };
    }

    // Validate use case specific constraints
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

    let receivedChargingNeeds;
    let transactionDatabaseId;
    if (
      chargingProfile.chargingProfilePurpose ===
      ChargingProfilePurposeEnumType.TxProfile
    ) {
      // OCPP 2.0.1 Part 2 K01.FR.03
      if (!chargingProfile.transactionId) {
        return {
          success: false,
          payload:
            'Missing transactionId for chargingProfilePurpose TxProfile.',
        };
      }

      // OCPP 2.0.1 Part 2 K01.FR.09
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
      transactionDatabaseId = transaction.id;

      // OCPP 2.0.1 Part 2 K01.FR.16
      if (request.evseId <= 0) {
        return {
          success: false,
          payload: 'TxProfile SHALL only be be used with evseId >0.',
        };
      }

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
      // OCPP 2.0.1 Part 2 K01.FR.34
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
      // OCPP 2.0.1 Part 2 K01.FR.22
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
        // OCPP 2.0.1 Part 2 K01.FR.38
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
        `Found existing charging profiles: ${JSON.stringify(existedChargingProfiles)}`,
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

    const acPhaseSwitchingSupported: VariableAttribute[] =
      await this._module.deviceModelRepository.readAllByQuerystring({
        stationId: identifier,
        component_evse_id: request.evseId,
        component_name: 'SmartChargingCtrlr',
        variable_name: 'ACPhaseSwitchingSupported',
        type: AttributeEnumType.Actual,
      });
    this._logger.info(
      `Found ACPhaseSwitchingSupported: ${JSON.stringify(acPhaseSwitchingSupported)}`,
    );
    for (const chargingSchedule of chargingProfile.chargingSchedule) {
      // OCPP 2.0.1 Part 2 K01.FR.31
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

      // OCPP 2.0.1 Part 2 K01.FR.26
      const chargingScheduleChargingRateUnit = await this._module.deviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance('RateUnit', null);
      if (chargingScheduleChargingRateUnit && chargingScheduleChargingRateUnit.valuesList) {
        try {
          const chargingRateUnits = stringToSet(chargingScheduleChargingRateUnit.valuesList);
          if (!chargingRateUnits.has(chargingSchedule.chargingRateUnit)) {
            return {
              success: false,
              payload: `ChargingSchedule ${chargingSchedule.id}: chargingRateUnit SHALL be one of ${chargingScheduleChargingRateUnit.valuesList}.`,
            }
          }
        } catch (error) {
          this._logger.error(`Failed to validate chargingRateUnit. Found unexpected valueList in RateUnit: ${JSON.stringify(chargingScheduleChargingRateUnit.valuesList)}`, error);
        }
      }

      // OCPP 2.0.1 Part 2 K01.FR.35
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
            throw new Error(
              `ChargingSchedule ${chargingSchedule.id}: PhaseToUse SHALL only be set with numberPhases = 1.`,
            );
          }
          // OCPP 2.0.1 Part 2 K01.FR.20
          if (
            acPhaseSwitchingSupported.length === 0 ||
            !acPhaseSwitchingSupported[0].value
          ) {
            throw new Error(
              `ChargingSchedule ${chargingSchedule.id}: PhaseToUse SHALL only be set if ACPhaseSwitchingSupported is defined and true.`,
            );
          }
        }
      }
    }

    await this._module.chargingProfileRepository.createOrUpdateChargingProfile(
      chargingProfile,
      request.evseId,
      transactionDatabaseId,
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
