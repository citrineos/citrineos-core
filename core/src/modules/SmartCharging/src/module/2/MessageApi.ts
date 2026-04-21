// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, IMessageConfirmation, OCPP2_request_types } from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  AttributeEnum,
  ChargingLimitSourceEnum,
  ChargingProfileKindEnum,
  ChargingProfilePurposeEnum,
  DataEnum,
  DEFAULT_TENANT_ID,
  getOcpp2Schema,
  Namespace,
  OCPP1_6_Namespace,
  OCPP2_Namespace,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import * as OCPP2_0_1_Mapper from '@dal/layers/sequelize/mapper/2.0.1/index.js';
import { VariableAttribute } from '@dal/layers/sequelize/model/DeviceModel/index.js';
import { packageGroupCall, stringToSet, validateChargingProfileType } from '@util/index.js';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ISmartChargingModuleApi } from '../interface.js';
import { SmartChargingModule } from '../module.js';

const DEFAULT_VERSION = OCPPVersion.OCPP2_0_1;

/**
 * Server API for the SmartCharging module.
 */
export class SmartChargingOcpp2Api
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
    version: OCPPVersion = DEFAULT_VERSION,
    logger?: Logger<ILogObj>,
  ) {
    super(smartChargingModule, server, version, logger);
  }

  @AsMessageEndpoint(OCPP_CallAction.ClearChargingProfile, (instance: SmartChargingOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'ClearChargingProfileRequestSchema',
    ),
  )
  async clearChargingProfile(
    identifier: string[],
    request: OCPP2_request_types.ClearChargingProfileRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const responses: IMessageConfirmation[] = [];

    for (const id of identifier) {
      const chargingProfileCriteria = request.chargingProfileCriteria;

      // OCPP 2.0.1 Part 2 K10.FR.02
      if (!request.chargingProfileId) {
        if (!chargingProfileCriteria) {
          responses.push({
            success: false,
            payload: 'Either chargingProfileId or chargingProfileCriteria must be provided',
          });
          continue;
        } else {
          if (
            !chargingProfileCriteria.chargingProfilePurpose &&
            !chargingProfileCriteria.stackLevel &&
            !chargingProfileCriteria.evseId
          ) {
            responses.push({
              success: false,
              payload:
                'At least one of chargingProfilePurpose, stackLevel, or evseId must be provided when chargingProfileId is not provided.',
            });
            continue;
          }
        }
      } else {
        if (chargingProfileCriteria) {
          responses.push({
            success: false,
            payload: 'chargingProfileCriteria is not needed when chargingProfileId is provided.',
          });
          continue;
        }
      }

      // OCPP 2.0.1 Part 2 K10.FR.06
      if (
        chargingProfileCriteria?.chargingProfilePurpose ===
        ChargingProfilePurposeEnum.ChargingStationExternalConstraints
      ) {
        responses.push({
          success: false,
          payload:
            'The CSMS SHALL NOT set chargingProfilePurpose to ChargingStationExternalConstraints.',
        });
        continue;
      }

      const response = await this._module.sendCall(
        id,
        tenantId,
        this._ocppVersion ?? DEFAULT_VERSION,
        OCPP_CallAction.ClearChargingProfile,
        request,
        callbackUrl,
      );

      responses.push(response);
    }

    return responses;
  }

  @AsMessageEndpoint(OCPP_CallAction.GetChargingProfiles, (instance: SmartChargingOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetChargingProfilesRequestSchema',
    ),
  )
  async getChargingProfiles(
    identifier: string[],
    request: OCPP2_request_types.GetChargingProfilesRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const chargingProfile = request.chargingProfile;

    // OCPP 2.0.1 Part 2 K09.FR.03
    if (chargingProfile.chargingProfileId) {
      if (
        chargingProfile.chargingProfilePurpose ||
        chargingProfile.stackLevel ||
        chargingProfile.chargingLimitSource
      ) {
        return identifier.map(() => ({
          success: false,
          payload:
            'chargingProfilePurpose, stackLevel, and chargingLimitSource are not needed when chargingProfileId is provided.',
        }));
      }
    } else {
      if (
        !chargingProfile.chargingProfilePurpose &&
        !chargingProfile.stackLevel &&
        !chargingProfile.chargingLimitSource
      ) {
        return identifier.map(() => ({
          success: false,
          payload:
            'At least one of chargingProfilePurpose, stackLevel, or chargingLimitSource must be provided when chargingProfileId is not provided.',
        }));
      }
    }

    // Validate ChargingProfileCriterionType.chargingProfileId
    if (chargingProfile.chargingProfileId && chargingProfile.chargingProfileId.length > 1) {
      const chargingProfilesEntries =
        await this._module.deviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance(
          tenantId,
          'Entries',
          'ChargingProfiles',
        );
      if (
        chargingProfilesEntries &&
        chargingProfilesEntries.maxLimit &&
        chargingProfile.chargingProfileId.length > chargingProfilesEntries.maxLimit
      ) {
        return identifier.map(() => ({
          success: false,
          payload: `The max length of chargingProfileId is ${chargingProfilesEntries.maxLimit}.`,
        }));
      }
    }

    // Send calls for each station
    const results = await packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.GetChargingProfiles,
      request,
      callbackUrl,
    );
    return results;
  }

  @AsMessageEndpoint(OCPP_CallAction.SetChargingProfile, (instance: SmartChargingOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'SetChargingProfileRequestSchema',
    ),
  )
  async setChargingProfile(
    identifier: string[],
    request: OCPP2_request_types.SetChargingProfileRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    // Process each station individually
    return Promise.all(
      identifier.map(async (id) => {
        this._logger.info(
          `Received SetChargingProfile for station ${id}: ${JSON.stringify(request)}`,
        );

        const chargingProfile = request.chargingProfile;
        // Validate ChargingProfileType's constraints
        try {
          await validateChargingProfileType(
            chargingProfile,
            tenantId,
            id,
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

        // Additional use case checks
        const now = new Date();
        const validFrom = chargingProfile.validFrom ? new Date(chargingProfile.validFrom) : null;
        const validTo = chargingProfile.validTo ? new Date(chargingProfile.validTo) : null;

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

        // If TxProfile
        if (chargingProfile.chargingProfilePurpose === ChargingProfilePurposeEnum.TxProfile) {
          // OCPP 2.0.1 Part 2 K01.FR.03
          if (!chargingProfile.transactionId) {
            return {
              success: false,
              payload: 'Missing transactionId for chargingProfilePurpose TxProfile.',
            };
          }
          // OCPP 2.0.1 Part 2 K01.FR.09
          const transaction =
            await this._module.transactionEventRepository.readTransactionByStationIdAndTransactionId(
              tenantId,
              id,
              chargingProfile.transactionId,
            );
          if (!transaction) {
            return {
              success: false,
              payload: `Transaction ${chargingProfile.transactionId} not found on station ${id}.`,
            };
          }
          // OCPP 2.0.1 Part 2 K01.FR.16
          if (request.evseId <= 0) {
            return {
              success: false,
              payload: 'TxProfile SHALL only be used with evseId > 0.',
            };
          }

          const evse = await this._module.deviceModelRepository.findEvseByIdAndConnectorId(
            tenantId,
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

          // OCPP 2.0.1 Part 2 K01.FR.34
          // Must have received a NotifyEVChargingNeedsReq if more than one schedule is provided
          const receivedChargingNeeds =
            await this._module.chargingProfileRepository.findChargingNeedsByEvseDBIdAndTransactionDBId(
              tenantId,
              evse.databaseId,
              transaction.id,
            );
          if (!receivedChargingNeeds && chargingProfile.chargingSchedule.length > 1) {
            return {
              success: false,
              payload: `No prior NotifyEVChargingNeedsReq found for this transaction ${transaction.id}. Only one ChargingScheduleType allowed without it.`,
            };
          }

          // OCPP 2.0.1 Part 2 K01.FR.39
          const numExisted = await this._module.chargingProfileRepository.existByQuery(tenantId, {
            where: {
              stackLevel: chargingProfile.stackLevel,
              transactionDatabaseId: transaction.id,
              chargingProfilePurpose: chargingProfile.chargingProfilePurpose,
              isActive: true,
              tenantId,
            },
          });
          if (numExisted > 0) {
            return {
              success: false,
              payload: `${numExisted} ChargingProfile with stackLevel ${chargingProfile.stackLevel} and transactionId ${chargingProfile.transactionId} already exists.`,
            };
          }
        } else if (
          chargingProfile.chargingProfilePurpose ===
          ChargingProfilePurposeEnum.ChargingStationExternalConstraints
        ) {
          // OCPP 2.0.1 Part 2 K01.FR.22
          return {
            success: false,
            payload:
              'The CSMS SHALL NOT set chargingProfilePurpose to ChargingStationExternalConstraints.',
          };
        } else {
          // E.g., ChargingStationMaxProfile or custom
          if (
            chargingProfile.chargingProfilePurpose ===
            ChargingProfilePurposeEnum.ChargingStationMaxProfile
          ) {
            // OCPP 2.0.1 Part 2 K01.FR.38
            if (chargingProfile.chargingProfileKind === ChargingProfileKindEnum.Relative) {
              return {
                success: false,
                payload:
                  'When chargingProfilePurpose is ChargingStationMaxProfile, chargingProfileKind SHALL NOT be Relative.',
              };
            }
          }

          // Check for existing profiles with the same stack level and purpose
          const existedChargingProfiles =
            await this._module.chargingProfileRepository.readAllByQuery(tenantId, {
              where: {
                stationId: id,
                stackLevel: chargingProfile.stackLevel,
                chargingProfilePurpose: chargingProfile.chargingProfilePurpose,
                evseId: request.evseId,
                isActive: true,
                tenantId,
              },
            });
          this._logger.info(
            `Found existing charging profiles: ${JSON.stringify(existedChargingProfiles)}`,
          );
          if (existedChargingProfiles.length > 0) {
            if (!validTo) {
              return {
                success: false,
                payload:
                  'No two charging profiles with the same stack level and purpose can be valid at the same time.',
              };
            } else {
              for (const existedProfile of existedChargingProfiles) {
                const existedValidTo = existedProfile.validTo
                  ? new Date(existedProfile.validTo)
                  : null;
                if (!existedValidTo || existedValidTo.getTime() >= validTo.getTime()) {
                  return {
                    success: false,
                    payload:
                      'No two charging profiles with the same stack level and purpose can be valid at the same time.',
                  };
                }
              }
            }
          }
        }

        // Additional checks on scheduling
        const acPhaseSwitchingSupported: VariableAttribute[] =
          await this._module.deviceModelRepository.readAllByQuerystring(tenantId, {
            tenantId,
            stationId: id,
            component_evse_id: request.evseId,
            component_name: 'SmartChargingCtrlr',
            variable_name: 'ACPhaseSwitchingSupported',
            type: AttributeEnum.Actual,
          });
        this._logger.info(
          `Found ACPhaseSwitchingSupported for station ${id}: ${JSON.stringify(
            acPhaseSwitchingSupported,
          )}`,
        );
        const rateUnitMemberList = await this._getChargingRateUnitMemberList(tenantId);
        for (const chargingSchedule of chargingProfile.chargingSchedule) {
          // OCPP 2.0.1 Part 2 K01.FR.31
          if (chargingSchedule.chargingSchedulePeriod[0].startPeriod !== 0) {
            return {
              success: false,
              payload:
                `ChargingSchedule ${chargingSchedule.id}: ` +
                `The startPeriod of the first chargingSchedulePeriod SHALL be 0.`,
            };
          }

          if (
            chargingProfile.chargingProfileKind === ChargingProfileKindEnum.Absolute ||
            chargingProfile.chargingProfileKind === ChargingProfileKindEnum.Recurring
          ) {
            // OCPP 2.0.1 Part 2 K01.FR.40
            if (!chargingSchedule.startSchedule) {
              return {
                success: false,
                payload:
                  `ChargingSchedule ${chargingSchedule.id}: ` +
                  `startSchedule SHALL be set when chargingProfileKind is Absolute or Recurring.`,
              };
            }
          } else if (chargingProfile.chargingProfileKind === ChargingProfileKindEnum.Relative) {
            // OCPP 2.0.1 Part 2 K01.FR.41
            if (chargingSchedule.startSchedule) {
              return {
                success: false,
                payload:
                  `ChargingSchedule ${chargingSchedule.id}: ` +
                  `startSchedule SHALL be absent when chargingProfileKind is Relative.`,
              };
            }
          }

          // OCPP 2.0.1 Part 2 K01.FR.26
          if (rateUnitMemberList && !rateUnitMemberList.has(chargingSchedule.chargingRateUnit)) {
            return {
              success: false,
              payload:
                `ChargingSchedule ${chargingSchedule.id}: ` +
                `chargingRateUnit SHALL be one of ${JSON.stringify(
                  Array.from(rateUnitMemberList),
                )}.`,
            };
          }

          // Sort periods by ascending startPeriod
          chargingSchedule.chargingSchedulePeriod.sort((p1, p2) => {
            if (p1.startPeriod > p2.startPeriod) return 1;
            if (p1.startPeriod < p2.startPeriod) return -1;
            return 0;
          });

          // More checks on each period
          for (const chargingSchedulePeriod of chargingSchedule.chargingSchedulePeriod) {
            if (chargingSchedulePeriod.phaseToUse) {
              // OCPP 2.0.1 Part 2 K01.FR.19
              if (chargingSchedulePeriod.numberPhases !== 1) {
                return {
                  success: false,
                  payload: `chargingSchedulePeriod with phaseToUse requires numberPhases=1`,
                };
              }
              // If AC switching not supported
              if (!acPhaseSwitchingSupported.length) {
                return {
                  success: false,
                  payload: `phaseToUse not allowed if AC phase switching is not supported by station ${id}.`,
                };
              }
            }
          }
        }

        // Save the charging profile, set the source to "CSO"
        await this._module.chargingProfileRepository.createOrUpdateChargingProfile(
          tenantId,
          OCPP2_0_1_Mapper.ChargingProfileMapper.fromChargingProfileType(chargingProfile), //TODO: For 2.1, we need to review the mappers and update them where needed. Rename to OCPP2 mapper
          id,
          request.evseId,
          ChargingLimitSourceEnum.CSO,
        );

        // Finally, send the call to the station
        return this._module.sendCall(
          id,
          tenantId,
          this._ocppVersion ?? DEFAULT_VERSION,
          OCPP_CallAction.SetChargingProfile,
          request,
          callbackUrl,
        );
      }),
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.ClearedChargingLimit, (instance: SmartChargingOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'ClearedChargingLimitRequestSchema',
    ),
  )
  clearedChargingLimit(
    identifier: string[],
    request: OCPP2_request_types.ClearedChargingLimitRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      this._ocppVersion ?? DEFAULT_VERSION,
      OCPP_CallAction.ClearedChargingLimit,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.GetCompositeSchedule, (instance: SmartChargingOcpp2Api) =>
    getOcpp2Schema(
      (instance._ocppVersion ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetCompositeScheduleRequestSchema',
    ),
  )
  async getCompositeSchedule(
    identifier: string[],
    request: OCPP2_request_types.GetCompositeScheduleRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    return Promise.all(
      identifier.map(async (id) => {
        // OCPP 2.0.1 Part 2 K08.FR.05
        if (request.evseId !== 0) {
          const evse = await this._module.deviceModelRepository.findEvseByIdAndConnectorId(
            tenantId,
            request.evseId,
            null,
          );
          if (!evse) {
            return {
              success: false,
              payload: `EVSE ${request.evseId} not found for station ${id}.`,
            };
          }
          this._logger.info(`Found evse for station ${id}: ${JSON.stringify(evse)}`);
        }

        // OCPP 2.0.1 Part 2 K08.FR.07
        if (request.chargingRateUnit) {
          const rateUnitMemberList = await this._getChargingRateUnitMemberList(tenantId);
          if (rateUnitMemberList && !rateUnitMemberList.has(request.chargingRateUnit)) {
            return {
              success: false,
              payload: `chargingRateUnit SHALL be one of ` + `[${Array.from(rateUnitMemberList)}].`,
            };
          }
        }

        return this._module.sendCall(
          id,
          tenantId,
          this._ocppVersion ?? DEFAULT_VERSION,
          OCPP_CallAction.GetCompositeSchedule,
          request,
          callbackUrl,
        );
      }),
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

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = this._module.config.modules.smartcharging?.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }

  /**
   * Returns a set of allowed RateUnit values (if defined on the station).
   */
  private async _getChargingRateUnitMemberList(tenantId: number): Promise<Set<string> | undefined> {
    const chargingScheduleChargingRateUnit =
      await this._module.deviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance(
        tenantId,
        'RateUnit',
        null,
      );
    this._logger.info(`Found RateUnit: ${JSON.stringify(chargingScheduleChargingRateUnit)}`);
    if (
      chargingScheduleChargingRateUnit &&
      chargingScheduleChargingRateUnit.dataType === DataEnum.MemberList &&
      chargingScheduleChargingRateUnit.valuesList
    ) {
      return stringToSet(chargingScheduleChargingRateUnit.valuesList);
    }
  }
}
