// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import {EnergyMixData} from "./EnergyMix";

import {
  assert,
  CountryCode,
  Currency,
  Displaytext,
  isCountryCode,
  isCurrency,
  isPartyId,
  isTariffId,
  isUrl,
  Namespace,
  PartyId,
  TariffId,
  TariffKey,
  Url
} from '@citrineos/base';
import {Column, DataType, HasMany, Index, Model, PrimaryKey, Table} from 'sequelize-typescript';
import {Price} from "./Price";
import {TariffElement, TariffElementData} from "./TariffElement";

export const ALL_TARIFF_TYPES = [
  'AD_HOC_PAYMENT',
  'PROFILE_CHEAP',
  'PROFILE_FAST',
  'PROFILE_GREEN',
  'REGULAR'
] as const;

export type TariffType = typeof ALL_TARIFF_TYPES[number];

function isTariffType(value: string): value is TariffType {
  return (ALL_TARIFF_TYPES as readonly string[]).includes(value);
}

export function tariffType(value: string): TariffType {
  assert(isTariffType(value), `Invalid tariff type: ${value}`);
  return value;
}

@Table
export class Tariff extends Model implements TariffData {

  static readonly MODEL_NAME: string = Namespace.Tariff;

  public static newInstance(data: TariffData): Tariff {
    return Tariff.build({...data}, {include: [TariffElement]});
  }

  @PrimaryKey
  @Column({
    type: DataType.STRING(36),
    validate: {
      isTariffId: (value: string) => assert(isTariffId(value), `Invalid id: ${value}`),
    }
  })
  declare id: TariffId;

  @Index
  @Column(DataType.STRING)
  declare stationId: string; // TODO: ??

  @PrimaryKey
  @Column({
    type: DataType.CHAR(2),
    allowNull: false,
    validate: {
      isCountryCode: (value: string) => assert(isCountryCode(value), `Invalid countryCode: ${value}`),
    }
  })
  declare countryCode: CountryCode;

  @PrimaryKey
  @Column({
    type: DataType.STRING(3),
    allowNull: false,
    validate: {
      isPartyId: (value: string) => assert(isPartyId(value), `Invalid partyId: ${value}`),
    }
  })
  declare partyId: PartyId;

  @Column({
    type: DataType.CHAR(3),
    allowNull: false,
    validate: {
      isCurrency: (value: string) => assert(isCurrency(value), `Invalid currency: ${value}`),
    }
  })
  declare currency: Currency;

  @Column({
    type: DataType.STRING,
    validate: {
      isTariffType: (value: string) => assert(isTariffType(value), `Invalid type: ${value}`),
    }
  })
  declare type?: TariffType;

  @Column({
    type: DataType.JSON
  })
  declare tariffAltText?: Displaytext[];

  @Column({
    type: DataType.STRING(255),
    validate: {
      url: (value: string) => assert(isUrl(value), `Invalid tariffAltUrl: ${value}`),
    }
  })
  declare tariffAltUrl?: Url;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('minPriceExclVat'));
    }
  })
  private declare minPriceExclVat?: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('minPriceInclVat'));
    }
  })
  private declare minPriceInclVat?: number;

  @Column(DataType.VIRTUAL)
  get minPrice(): Price | undefined {
    if (this.minPriceExclVat === undefined) {
      return undefined;
    }

    return {
      exclVat: this.minPriceExclVat,
      inclVat: this.minPriceInclVat
    };
  }

  set minPrice(price: Price | undefined) {
    this.minPriceExclVat = price?.exclVat;
    this.minPriceInclVat = price?.inclVat;
  }

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('maxPriceExclVat'));
    }
  })
  private declare maxPriceExclVat?: number;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('maxPriceInclVat'));
    }
  })
  private declare maxPriceInclVat?: number;

  @Column(DataType.VIRTUAL)
  get maxPrice(): Price | undefined {
    if (this.maxPriceExclVat === undefined) {
      return undefined;
    }

    return {
      exclVat: this.maxPriceExclVat,
      inclVat: this.maxPriceInclVat
    };
  }

  set maxPrice(price: Price | undefined) {
    this.maxPriceExclVat = price?.exclVat;
    this.maxPriceInclVat = price?.inclVat;
  }

  @HasMany(() => TariffElement, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare elements: TariffElement[];

  @Column({
    type: DataType.DATE,
    get(this: Tariff) {
      return new Date(this.getDataValue('lastUpdated'));
    },
    set(this: Tariff, value: Date) {
      this.setDataValue('startDateTime', value?.toISOString());
    }
  })
  declare startDateTime?: Date;

  @Column({
    type: DataType.DATE,
    get(this: Tariff) {
      return new Date(this.getDataValue('lastUpdated'));
    },
    set(this: Tariff, value: Date) {
      this.setDataValue('endDateTime', value?.toISOString());
    }
  })
  declare endDateTime?: Date;

  @Column({
    type: DataType.DATE,
    get(this: Tariff) {
      return new Date(this.getDataValue('lastUpdated'));
    },
    set(this: Tariff, value: Date) {
      this.setDataValue('lastUpdated', value?.toISOString());
    }
  })
  declare lastUpdated: Date;

  @Column(DataType.JSON)
  declare energyMix?: EnergyMixData;

  @Column({
    type: DataType.DECIMAL(19, 4),
    get(this: Tariff) {
      return parseFloat(this.getDataValue('authorizationAmount'));
    }
  })
  declare authorizationAmount: number;

  get data(): TariffData {
    return {
      id: this.id,
      stationId: this.stationId,
      countryCode: this.countryCode,
      partyId: this.partyId,
      currency: this.currency,
      type: this.type,
      tariffAltText: this.tariffAltText,
      tariffAltUrl: this.tariffAltUrl,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      elements: this.elementsData,
      energyMix: this.energyMix,
      startDateTime: this.startDateTime,
      endDateTime: this.endDateTime,
      lastUpdated: this.lastUpdated,
      authorizationAmount: this.authorizationAmount
    }
  }

  get elementsData(): TariffElementData[] {
    return this.elements.map(element => element.data);
  }

  get key(): TariffKey {
    return {
      id: this.id,
      countryCode: this.countryCode,
      partyId: this.partyId,
    };
  }

}

export type TariffData = {

  id: TariffId;
  stationId: string;

  countryCode: CountryCode;
  partyId: PartyId;

  currency: Currency;

  type?: TariffType;

  tariffAltText?: Displaytext[];
  tariffAltUrl?: Url;

  minPrice?: Price;
  maxPrice?: Price;

  elements: TariffElementData[];

  energyMix?: EnergyMixData;

  startDateTime?: Date;
  endDateTime?: Date;
  lastUpdated: Date;

  authorizationAmount: number;
}
