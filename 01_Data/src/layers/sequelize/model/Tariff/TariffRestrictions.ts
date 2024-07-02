import {
  DateRange,
  DayOfWeek,
  DurationInSeconds,
  DurationRange,
  ElectricCurrentRange,
  HourMinute,
  KilowattHourRange,
  PowerRange,
  TimeRange,
  YearMonthDay
} from '@citrineos/base';
import {ReservationRestrictionType} from './ReservationRestrictionType';

export class TariffRestrictions implements TariffRestrictionsData {

  startTime?: HourMinute;
  endTime?: HourMinute;

  startDate?: YearMonthDay;
  endDate?: YearMonthDay;

  minKwh?: number;
  maxKwh?: number;

  minCurrent?: number;
  maxCurrent?: number;

  minPower?: number;
  maxPower?: number;

  minDuration?: DurationInSeconds;
  maxDuration?: DurationInSeconds;

  dayOfWeek?: DayOfWeek[];
  reservation?: ReservationRestrictionType;

  public constructor(data: TariffRestrictionsData) {
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
  }

}

export type TariffRestrictionsData =
    TimeRange &
    DateRange &
    KilowattHourRange &
    ElectricCurrentRange &
    PowerRange &
    DurationRange &
    {
      dayOfWeek?: DayOfWeek[];
      reservation?: ReservationRestrictionType;
    };
