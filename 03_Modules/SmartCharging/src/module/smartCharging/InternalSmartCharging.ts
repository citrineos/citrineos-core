import { ISmartCharging } from './SmartCharging';
import { OCPP2_0_1 } from '@citrineos/base';
import {
  IChargingProfileRepository,
  Transaction,
  ChargingSchedule,
  ChargingProfile,
} from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';

export class InternalSmartCharging implements ISmartCharging {
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected readonly _logger: Logger<ILogObj>;

  constructor(chargingProfileRepository: IChargingProfileRepository, logger?: Logger<ILogObj>) {
    this._chargingProfileRepository = chargingProfileRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Generates a `ChargingProfileType` from the given `NotifyEVChargingNeedsRequest`.
   *
   * This method creates a charging profile based on the EV's charging needs and the specified energy transfer mode.
   * The profile includes the necessary parameters to set up a charging schedule for the EV.
   *
   * @param request - The `NotifyEVChargingNeedsRequest` containing details about the EV's charging requirements.
   * @param transaction - The ID of the transaction associated with the charging profile.
   * @param stationId - The ID of the station
   * @returns A `ChargingProfileType`.
   *
   * @throws Error if the energy transfer mode is unsupported.
   */
  async calculateChargingProfile(
    request: OCPP2_0_1.NotifyEVChargingNeedsRequest,
    transaction: Transaction,
    tenantId: number,
    stationId: string,
  ): Promise<OCPP2_0_1.ChargingProfileType> {
    const { chargingNeeds } = request;

    const acParams = chargingNeeds.acChargingParameters;
    const dcParams = chargingNeeds.dcChargingParameters;
    const transferMode = chargingNeeds.requestedEnergyTransfer;

    // Default values
    const profileId = await this._chargingProfileRepository.getNextChargingProfileId(
      tenantId,
      stationId,
    );
    const profilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType =
      OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile;
    // Find existing charging profile and then add 1 as stack level
    const stackLevel = await this._chargingProfileRepository.getNextStackLevel(
      tenantId,
      stationId,
      transaction.id,
      profilePurpose,
    );

    // Create charging schedule
    const scheduleId = await this._chargingProfileRepository.getNextChargingScheduleId(
      tenantId,
      stationId,
    );
    let limit = 0;
    let numberPhases: number | undefined;
    let minChargingRate: number | undefined;
    let chargingRateUnit: OCPP2_0_1.ChargingRateUnitEnumType = OCPP2_0_1.ChargingRateUnitEnumType.A;
    // Determine charging parameters based on energy transfer mode
    switch (transferMode) {
      case OCPP2_0_1.EnergyTransferModeEnumType.AC_single_phase:
      case OCPP2_0_1.EnergyTransferModeEnumType.AC_two_phase:
      case OCPP2_0_1.EnergyTransferModeEnumType.AC_three_phase:
        if (acParams) {
          const { evMinCurrent, evMaxCurrent } = acParams;
          numberPhases =
            transferMode === OCPP2_0_1.EnergyTransferModeEnumType.AC_single_phase
              ? 1
              : transferMode === OCPP2_0_1.EnergyTransferModeEnumType.AC_two_phase
                ? 2
                : 3; // For AC_three_phase
          chargingRateUnit = OCPP2_0_1.ChargingRateUnitEnumType.A; // always use amp for AC
          limit = evMaxCurrent;
          minChargingRate = evMinCurrent;
        }
        break;
      case OCPP2_0_1.EnergyTransferModeEnumType.DC:
        if (dcParams) {
          const { evMaxPower, evMaxCurrent, evMaxVoltage } = dcParams;
          numberPhases = undefined; // For a DC EVSE this field should be omitted.
          [chargingRateUnit, limit] = this._getChargingRateUnitAndLimit(
            evMaxCurrent,
            evMaxVoltage,
            evMaxPower,
          );
        }
        break;
      default:
        throw new Error('Unsupported energy transfer mode');
    }

    await this._validateLimitAgainstExistingProfile(limit, tenantId, stationId, transaction.id);

    const departureTime = chargingNeeds.departureTime
      ? new Date(chargingNeeds.departureTime)
      : undefined;
    const currentTime = new Date();
    const duration = departureTime ? departureTime.getTime() - currentTime.getTime() : undefined;

    // Create charging period
    const chargingSchedulePeriod: [
      OCPP2_0_1.ChargingSchedulePeriodType,
      ...OCPP2_0_1.ChargingSchedulePeriodType[],
    ] = [
      {
        startPeriod: 0,
        limit,
        numberPhases,
      },
    ];

    const chargingSchedule: OCPP2_0_1.ChargingScheduleType = {
      id: scheduleId,
      duration,
      chargingRateUnit,
      chargingSchedulePeriod,
      minChargingRate,
    };

    return {
      id: profileId,
      stackLevel,
      chargingProfilePurpose: profilePurpose,
      chargingProfileKind: OCPP2_0_1.ChargingProfileKindEnumType.Absolute,
      validFrom: currentTime.toISOString(), // Now
      validTo: chargingNeeds.departureTime, // Until departure
      chargingSchedule: [chargingSchedule],
      transactionId: transaction.transactionId,
    } as OCPP2_0_1.ChargingProfileType;
  }

  async checkLimitsOfChargingSchedule(
    request: OCPP2_0_1.NotifyEVChargingScheduleRequest,
    tenantId: number,
    stationId: string,
    transaction: Transaction,
  ): Promise<void> {
    const givenChargingPeriods = request.chargingSchedule.chargingSchedulePeriod;
    const existingChargingProfile = await this._findExistingChargingProfileWithHighestStackLevel(
      tenantId,
      stationId,
      transaction.id,
    );

    // Currently, we simply check the limit in each charging period
    if (existingChargingProfile) {
      if (existingChargingProfile.chargingSchedule.length === 1) {
        const existingChargingPeriods =
          existingChargingProfile.chargingSchedule[0].chargingSchedulePeriod;
        if (givenChargingPeriods.length === existingChargingPeriods.length) {
          for (let i = 0; i < givenChargingPeriods.length; i++) {
            if (givenChargingPeriods[i].limit > existingChargingPeriods[i].limit) {
              throw new Error(
                `Given limits ${givenChargingPeriods[i].limit} exceeds existing limits ${existingChargingPeriods[i].limit} in charging profile ${existingChargingProfile.databaseId}.`,
              );
            }
          }
        } else {
          throw new Error(
            `Given charging periods and existing charging periods in charging profile ${existingChargingProfile.databaseId} are unmatched.`,
          );
        }
      } else {
        throw new Error(
          `Existing charging profile ${existingChargingProfile.databaseId} have more than one charging schedules.`,
        );
      }
    }
  }

  private _getChargingRateUnitAndLimit(
    evMaxCurrent: number,
    evMaxVoltage: number,
    evMaxPower?: number | null,
  ): [OCPP2_0_1.ChargingRateUnitEnumType, number] {
    if (evMaxPower && evMaxPower < evMaxCurrent * evMaxVoltage) {
      // when charging rate unit is W, multiply by 1000
      // based on OCPP 2.0.1 V3 Part 6 TC_K_57_CS
      return [OCPP2_0_1.ChargingRateUnitEnumType.W, evMaxPower * 1000];
    }
    return [OCPP2_0_1.ChargingRateUnitEnumType.A, evMaxCurrent * evMaxVoltage];
  }

  private async _findExistingChargingProfileWithHighestStackLevel(
    tenantId: number,
    stationId: string,
    transactionDatabaseId: string,
  ): Promise<ChargingProfile | undefined> {
    const existingChargingProfiles = await this._chargingProfileRepository.readAllByQuery(
      tenantId,
      {
        where: {
          tenantId,
          stationId,
          transactionDatabaseId,
          chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
        },
        order: [['stackLevel', 'DESC']],
        limit: 1,
        include: [ChargingSchedule],
      },
    );
    if (existingChargingProfiles.length > 0) {
      return existingChargingProfiles[0];
    } else {
      return undefined;
    }
  }

  private async _validateLimitAgainstExistingProfile(
    limit: number,
    tenantId: number,
    stationId: string,
    transactionDataBaseId: string,
  ): Promise<void> {
    const existingChargingProfile = await this._findExistingChargingProfileWithHighestStackLevel(
      tenantId,
      stationId,
      transactionDataBaseId,
    );

    if (existingChargingProfile) {
      this._logger.info(`Found existing charging profile ${existingChargingProfile.databaseId}`);

      for (const schedule of existingChargingProfile.chargingSchedule) {
        for (const period of schedule.chargingSchedulePeriod) {
          if (period.limit < limit) {
            this._logger.error(
              `Limit ${limit} is bigger than existing limit ${period.limit} in charging schedule ${schedule.id}`,
            );
            throw new Error(
              `Limit ${limit} is bigger than existing limit ${period.limit} in charging schedule ${schedule.id}`,
            );
          }
        }
      }
    }
  }
}
