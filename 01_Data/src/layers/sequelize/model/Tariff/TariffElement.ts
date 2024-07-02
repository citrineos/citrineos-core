import {PriceComponent} from './PriceComponent';
import {TariffRestrictions} from './TariffRestrictions';
import {BelongsTo, Column, DataType, ForeignKey, Model, Table,} from "sequelize-typescript";
import {
    assert,
    DateOnly,
    DayOfWeek,
    DurationInSeconds,
    hasDuplicates,
    isTariffId,
    Namespace,
    notEmpty,
    safelyMap,
    TariffId,
    Time
} from "@citrineos/base";
import {Tariff} from "./Tariffs";
import {ReservationRestrictionType} from "./ReservationRestrictionType";
import {TimeColumn} from "../../types/TimeColumn";
import {DateOnlyColumn} from "../../types/DateOnlyColumn";

@Table
export class TariffElement extends Model implements TariffElementData {

  static readonly MODEL_NAME: string = Namespace.TariffElement;

  public static newInstance(data: TariffElementData): TariffElement {
    return TariffElement.build({...data});
  }

  @BelongsTo(() => Tariff)
  declare tariff: Tariff;

  @ForeignKey(() => Tariff)
  @Column({
    type: DataType.STRING,
    validate: {
      isTariffId: (value: string) => assert(isTariffId(value), `Invalid tariffId: ${value}`),
    }
  })
  declare tariffId: TariffId;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    validate: {
      notNull: true,
      atLeastOne: (value: PriceComponent[]) => assert(notEmpty(value), `priceComponents cannot be empty`),
      hasNoDuplicates: (value: PriceComponent[]) => assert(!hasDuplicates(value, 'type'), 'priceComponents cannot contain duplicates'),
    }
  })
  declare priceComponents: PriceComponent[];

  @Column(DataType.VIRTUAL)
  get restrictions(): TariffRestrictions {
    return {
      startTime: this.startTime?.hourMinute,
      endTime: this.endTime?.hourMinute,
      startDate: this.startDate?.yearMonthDay,
      endDate: this.endDate?.yearMonthDay,
      minKwh: this.minKwh,
      maxKwh: this.maxKwh,
      minCurrent: this.minCurrent,
      maxCurrent: this.maxCurrent,
      minPower: this.minPower,
      maxPower: this.maxPower,
      minDuration: this.minDuration,
      maxDuration: this.maxDuration,
      dayOfWeek: this.dayOfWeek,
      reservation: this.reservation,
    };
  }

  set restrictions(restrictions: TariffRestrictions) {
    this.startTime = safelyMap(restrictions.startTime, Time.of);
    this.endTime = safelyMap(restrictions.endTime, Time.of);
    this.startDate = safelyMap(restrictions.startDate, DateOnly.of);
    this.endDate = safelyMap(restrictions.endDate, DateOnly.of);
    this.minKwh = restrictions.minKwh;
    this.maxKwh = restrictions.maxKwh;
    this.minCurrent = restrictions.minCurrent;
    this.maxCurrent = restrictions.maxCurrent;
    this.minPower = restrictions.minPower;
    this.maxPower = restrictions.maxPower;
    this.minDuration = restrictions.minDuration;
    this.maxDuration = restrictions.maxDuration;
    this.dayOfWeek = restrictions.dayOfWeek;
    this.reservation = restrictions.reservation;
  }

  @TimeColumn()
  private declare startTime?: Time;

  @TimeColumn()
  private declare endTime?: Time;

  @DateOnlyColumn()
  private declare startDate?: DateOnly;

  @DateOnlyColumn()
  private declare endDate?: DateOnly;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('minKwh'));
    }
  })
  private declare minKwh?: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('maxKwh'));
    }
  })
  private declare maxKwh?: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('minCurrent'));
    }
  })
  private declare minCurrent?: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('maxCurrent'));
    }
  })
  private declare maxCurrent?: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('minPower'));
    }
  })
  private declare minPower?: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('maxPower'));
    }
  })
  private declare maxPower?: number;

  @Column(DataType.INTEGER)
  private declare minDuration?: DurationInSeconds;

  @Column(DataType.INTEGER)
  private declare maxDuration?: DurationInSeconds;

  @Column(DataType.ARRAY(DataType.STRING))
  private declare dayOfWeek?: DayOfWeek[];

  @Column(DataType.STRING)
  private declare reservation?: ReservationRestrictionType;

  get data(): TariffElementData {
    return {
      priceComponents: this.priceComponents,
      restrictions: this.restrictions
    };
  }

}

export type TariffElementData = {
  priceComponents: PriceComponent[];
  restrictions: TariffRestrictions;
}
