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
import {
  AttributeEnum,
  ChargingLimitSourceEnum,
  ChargingProfileKindEnum,
  ChargingProfilePurposeEnum,
  EventGroup,
  OCPP_CallAction,
  type OCPPVersion,
  type OCPP2_request_types,
} from '@citrineos/types';
import type {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import * as OCPP2_0_1_Mapper from '@dal/layers/sequelize/mapper/2.0.1/index.js';
import {
  type ChargingProfileTransactionContext,
  validateChargingProfileType,
} from '@util/index.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';
import { readChargingRateUnitMemberList } from './chargingRateUnits.js';

type SetChargingProfileRequest = OCPP2_request_types.SetChargingProfileRequest;
type ChargingProfile = SetChargingProfileRequest['chargingProfile'];

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelRepository: IDeviceModelRepository;
  chargingProfileRepository: IChargingProfileRepository;
  transactionEventRepository: ITransactionEventRepository;
}

export class SetChargingProfileEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.SetChargingProfile,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.SmartCharging,
    bodySchema: ocpp2Schema('SetChargingProfileRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _deviceModelRepository: IDeviceModelRepository;
  private readonly _chargingProfileRepository: IChargingProfileRepository;
  private readonly _transactionEventRepository: ITransactionEventRepository;

  constructor({
    logger,
    ocppSender,
    deviceModelRepository,
    chargingProfileRepository,
    transactionEventRepository,
  }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._deviceModelRepository = deviceModelRepository;
    this._chargingProfileRepository = chargingProfileRepository;
    this._transactionEventRepository = transactionEventRepository;
  }

  async handle(
    identifiers: string[],
    request: SetChargingProfileRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    return Promise.all(
      identifiers.map(async (ocppConnectionName) => {
        this._logger.info(
          `Received SetChargingProfile for station ${ocppConnectionName}: ${JSON.stringify(request)}`,
        );

        const chargingProfile = request.chargingProfile;
        let transactionContext: ChargingProfileTransactionContext | undefined;
        try {
          ({ transactionContext } = await validateChargingProfileType(
            chargingProfile,
            tenantId,
            ocppConnectionName,
            this._deviceModelRepository,
            this._chargingProfileRepository,
            this._transactionEventRepository,
            this._logger,
            request.evseId,
          ));
        } catch (error) {
          return {
            success: false,
            payload: error instanceof Error ? error.message : JSON.stringify(error),
          };
        }

        const rejection =
          this._rejectOnValidity(chargingProfile) ??
          (await this._rejectOnPurpose(
            request,
            ocppConnectionName,
            tenantId,
            transactionContext,
          )) ??
          (await this._rejectOnSchedules(request, ocppConnectionName, tenantId));
        if (rejection) {
          return rejection;
        }

        await this._chargingProfileRepository.createOrUpdateChargingProfile(
          tenantId,
          OCPP2_0_1_Mapper.ChargingProfileMapper.fromChargingProfileType(chargingProfile),
          ocppConnectionName,
          request.evseId,
          ChargingLimitSourceEnum.CSO,
        );

        return this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: version,
          action: OCPP_CallAction.SetChargingProfile,
          eventGroup: EventGroup.SmartCharging,
          payload: request,
          callbackUrl,
        });
      }),
    );
  }

  private _rejectOnValidity(chargingProfile: ChargingProfile): IMessageConfirmation | undefined {
    const now = Date.now();
    const validFrom = chargingProfile.validFrom ? new Date(chargingProfile.validFrom) : null;
    const validTo = chargingProfile.validTo ? new Date(chargingProfile.validTo) : null;

    if (validTo && validTo.getTime() <= now) {
      return {
        success: false,
        payload: `chargingProfile validTo ${chargingProfile.validTo} should be in the future.`,
      };
    }
    if (validFrom && validTo && validFrom.getTime() >= validTo.getTime()) {
      return {
        success: false,
        payload: `chargingProfile validFrom ${chargingProfile.validFrom} should be before validTo ${chargingProfile.validTo}.`,
      };
    }
    return undefined;
  }

  /**
   * Two profiles are valid at the same time unless one window ends before the other begins. An
   * absent validFrom means valid on receipt, and an absent validTo means valid until replaced.
   */
  private static _overlaps(
    left: { validFrom?: string | null; validTo?: string | null },
    right: { validFrom?: string | null; validTo?: string | null },
    now: number,
  ): boolean {
    const from = (profile: { validFrom?: string | null }) =>
      profile.validFrom ? new Date(profile.validFrom).getTime() : now;
    const to = (profile: { validTo?: string | null }) =>
      profile.validTo ? new Date(profile.validTo).getTime() : Number.POSITIVE_INFINITY;
    return from(left) < to(right) && from(right) < to(left);
  }

  private async _rejectOnPurpose(
    request: SetChargingProfileRequest,
    ocppConnectionName: string,
    tenantId: number,
    transactionContext: ChargingProfileTransactionContext | undefined,
  ): Promise<IMessageConfirmation | undefined> {
    const chargingProfile = request.chargingProfile;

    if (chargingProfile.chargingProfilePurpose === ChargingProfilePurposeEnum.TxProfile) {
      return this._rejectTxProfile(request, ocppConnectionName, tenantId, transactionContext);
    }

    if (
      chargingProfile.chargingProfilePurpose ===
      ChargingProfilePurposeEnum.ChargingStationExternalConstraints
    ) {
      return {
        success: false,
        payload:
          'The CSMS SHALL NOT set chargingProfilePurpose to ChargingStationExternalConstraints.',
      };
    }

    if (
      chargingProfile.chargingProfilePurpose ===
        ChargingProfilePurposeEnum.ChargingStationMaxProfile &&
      chargingProfile.chargingProfileKind === ChargingProfileKindEnum.Relative
    ) {
      return {
        success: false,
        payload:
          'When chargingProfilePurpose is ChargingStationMaxProfile, chargingProfileKind SHALL NOT be Relative.',
      };
    }

    const existedChargingProfiles = await this._chargingProfileRepository.readAllByQuery(tenantId, {
      where: {
        ocppConnectionName,
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
    const now = Date.now();
    if (
      existedChargingProfiles.some((existedProfile) =>
        SetChargingProfileEndpoint._overlaps(chargingProfile, existedProfile, now),
      )
    ) {
      return {
        success: false,
        payload:
          'No two charging profiles with the same stack level and purpose can be valid at the same time.',
      };
    }
    return undefined;
  }

  private async _rejectTxProfile(
    request: SetChargingProfileRequest,
    ocppConnectionName: string,
    tenantId: number,
    transactionContext: ChargingProfileTransactionContext | undefined,
  ): Promise<IMessageConfirmation | undefined> {
    const chargingProfile = request.chargingProfile;

    if (!chargingProfile.transactionId) {
      return {
        success: false,
        payload: 'Missing transactionId for chargingProfilePurpose TxProfile.',
      };
    }
    if (request.evseId <= 0) {
      return { success: false, payload: 'TxProfile SHALL only be used with evseId > 0.' };
    }
    if (!transactionContext) {
      return {
        success: false,
        payload: `Transaction ${chargingProfile.transactionId} not found on station ${ocppConnectionName}.`,
      };
    }

    const { transaction, chargingNeeds } = transactionContext;
    if (!chargingNeeds && chargingProfile.chargingSchedule.length > 1) {
      return {
        success: false,
        payload: `No prior NotifyEVChargingNeedsReq found for this transaction ${transaction.id}. Only one ChargingScheduleType allowed without it.`,
      };
    }

    const numExisted = await this._chargingProfileRepository.existByQuery(tenantId, {
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

    return undefined;
  }

  private async _rejectOnSchedules(
    request: SetChargingProfileRequest,
    ocppConnectionName: string,
    tenantId: number,
  ): Promise<IMessageConfirmation | undefined> {
    const chargingProfile = request.chargingProfile;

    const acPhaseSwitchingSupported = await this._deviceModelRepository.readAllByQuerystring(
      tenantId,
      {
        tenantId,
        ocppConnectionName,
        component_evse_id: request.evseId,
        component_name: 'SmartChargingCtrlr',
        variable_name: 'ACPhaseSwitchingSupported',
        type: AttributeEnum.Actual,
      },
    );
    this._logger.info(
      `Found ACPhaseSwitchingSupported for station ${ocppConnectionName}: ${JSON.stringify(
        acPhaseSwitchingSupported,
      )}`,
    );
    const rateUnitMemberList = await readChargingRateUnitMemberList(
      this._deviceModelRepository,
      tenantId,
      this._logger,
    );

    for (const chargingSchedule of chargingProfile.chargingSchedule) {
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
        if (!chargingSchedule.startSchedule) {
          return {
            success: false,
            payload:
              `ChargingSchedule ${chargingSchedule.id}: ` +
              `startSchedule SHALL be set when chargingProfileKind is Absolute or Recurring.`,
          };
        }
      } else if (
        chargingProfile.chargingProfileKind === ChargingProfileKindEnum.Relative &&
        chargingSchedule.startSchedule
      ) {
        return {
          success: false,
          payload:
            `ChargingSchedule ${chargingSchedule.id}: ` +
            `startSchedule SHALL be absent when chargingProfileKind is Relative.`,
        };
      }

      if (rateUnitMemberList && !rateUnitMemberList.has(chargingSchedule.chargingRateUnit)) {
        return {
          success: false,
          payload:
            `ChargingSchedule ${chargingSchedule.id}: ` +
            `chargingRateUnit SHALL be one of ${JSON.stringify(Array.from(rateUnitMemberList))}.`,
        };
      }

      chargingSchedule.chargingSchedulePeriod.sort((p1, p2) => p1.startPeriod - p2.startPeriod);

      for (const chargingSchedulePeriod of chargingSchedule.chargingSchedulePeriod) {
        if (!chargingSchedulePeriod.phaseToUse) {
          continue;
        }
        if (chargingSchedulePeriod.numberPhases !== 1) {
          return {
            success: false,
            payload: `chargingSchedulePeriod with phaseToUse requires numberPhases=1`,
          };
        }
        if (!acPhaseSwitchingSupported.length) {
          return {
            success: false,
            payload: `phaseToUse not allowed if AC phase switching is not supported by station ${ocppConnectionName}.`,
          };
        }
      }
    }

    return undefined;
  }
}
