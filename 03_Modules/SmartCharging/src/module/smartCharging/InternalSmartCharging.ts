import { ISmartCharging } from './SmartCharging';
import {
  ChargingProfileKindEnumType,
  ChargingProfilePurposeEnumType,
  ChargingProfileType,
  ChargingRateUnitEnumType,
  ChargingSchedulePeriodType,
  ChargingScheduleType,
  EnergyTransferModeEnumType,
  NotifyEVChargingNeedsRequest,
  NotifyEVChargingScheduleRequest,
} from '@citrineos/base';
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

  constructor(
    chargingProfileRepository: IChargingProfileRepository,
    logger?: Logger<ILogObj>,
  ) {
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
    request: NotifyEVChargingNeedsRequest,
    transaction: Transaction,
    stationId: string,
  ): Promise<ChargingProfileType> {
    const { chargingNeeds } = request;

    const acParams = chargingNeeds.acChargingParameters;
    const dcParams = chargingNeeds.dcChargingParameters;
    const transferMode = chargingNeeds.requestedEnergyTransfer;

    // Default values
    const profileId =
      await this._chargingProfileRepository.getNextChargingProfileId(stationId);
    const profilePurpose: ChargingProfilePurposeEnumType =
      ChargingProfilePurposeEnumType.TxProfile;
    // Find existing charging profile and then add 1 as stack level
    const stackLevel = await this._chargingProfileRepository.getNextStackLevel(
      stationId,
      transaction.id,
      profilePurpose,
    );

    // Create charging schedule
    const scheduleId =
      await this._chargingProfileRepository.getNextChargingScheduleId(
        stationId,
      );
    let limit = 0;
    let numberPhases: number | undefined;
    let minChargingRate: number | undefined;
    let chargingRateUnit: ChargingRateUnitEnumType = ChargingRateUnitEnumType.A;
    // Determine charging parameters based on energy transfer mode
    switch (transferMode) {
      case EnergyTransferModeEnumType.AC_single_phase:
      case EnergyTransferModeEnumType.AC_two_phase:
      case EnergyTransferModeEnumType.AC_three_phase:
        if (acParams) {
          const { evMinCurrent, evMaxCurrent } = acParams;
          numberPhases =
            transferMode === EnergyTransferModeEnumType.AC_single_phase
              ? 1
              : transferMode === EnergyTransferModeEnumType.AC_two_phase
                ? 2
                : 3; // For AC_three_phase
          chargingRateUnit = ChargingRateUnitEnumType.A; // always use amp for AC
          limit = evMaxCurrent;
          minChargingRate = evMinCurrent;
        }
        break;
      case EnergyTransferModeEnumType.DC:
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

    await this._validateLimitAgainstExistingProfile(
      limit,
      stationId,
      transaction.id,
    );

    const departureTime = chargingNeeds.departureTime
      ? new Date(chargingNeeds.departureTime)
      : undefined;
    const currentTime = new Date();
    const duration = departureTime
      ? departureTime.getTime() - currentTime.getTime()
      : undefined;

    // Create charging period
    const chargingSchedulePeriod: [
      ChargingSchedulePeriodType,
      ...ChargingSchedulePeriodType[],
    ] = [
      {
        startPeriod: 0,
        limit,
        numberPhases,
      },
    ];

    const chargingSchedule: ChargingScheduleType = {
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
      chargingProfileKind: ChargingProfileKindEnumType.Absolute,
      validFrom: currentTime.toISOString(), // Now
      validTo: chargingNeeds.departureTime, // Until departure
      chargingSchedule: [chargingSchedule],
      transactionId: transaction.transactionId,
    } as ChargingProfileType;
  }

  async checkLimitsOfChargingSchedule(
    request: NotifyEVChargingScheduleRequest,
    stationId: string,
    transaction: Transaction,
  ): Promise<void> {
    const givenChargingPeriods =
      request.chargingSchedule.chargingSchedulePeriod;
    const existingChargingProfile =
      await this._findExistingChargingProfileWithHighestStackLevel(
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
            if (
              givenChargingPeriods[i].limit > existingChargingPeriods[i].limit
            ) {
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
  ): [ChargingRateUnitEnumType, number] {
    if (evMaxPower && evMaxPower < evMaxCurrent * evMaxVoltage) {
      // when charging rate unit is W, multiply by 1000
      // based on OCPP 2.0.1 V3 Part 6 TC_K_57_CS
      return [ChargingRateUnitEnumType.W, evMaxPower * 1000];
    }
    return [ChargingRateUnitEnumType.A, evMaxCurrent * evMaxVoltage];
  }

  private async _findExistingChargingProfileWithHighestStackLevel(
    stationId: string,
    transactionDatabaseId: string,
  ): Promise<ChargingProfile | undefined> {
    const existingChargingProfiles =
      await this._chargingProfileRepository.readAllByQuery({
        where: {
          stationId,
          transactionDatabaseId,
          chargingProfilePurpose: ChargingProfilePurposeEnumType.TxProfile,
        },
        order: [['stackLevel', 'DESC']],
        limit: 1,
        include: [ChargingSchedule],
      });
    if (existingChargingProfiles.length > 0) {
      return existingChargingProfiles[0];
    } else {
      return undefined;
    }
  }

  private async _validateLimitAgainstExistingProfile(
    limit: number,
    stationId: string,
    transactionDataBaseId: string,
  ): Promise<void> {
    const existingChargingProfile =
      await this._findExistingChargingProfileWithHighestStackLevel(
        stationId,
        transactionDataBaseId,
      );

    if (existingChargingProfile) {
      this._logger.info(
        `Found existing charging profile ${existingChargingProfile.databaseId}`,
      );

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
