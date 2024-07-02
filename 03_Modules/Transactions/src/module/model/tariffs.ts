import {EnergyMix, EnergyMixData, Price, TariffElement, TariffType, tariffType} from "@citrineos/data";
import {
    countryCode,
    CountryCode,
    currency,
    Currency,
    Displaytext,
    PartyId,
    partyId,
    tariffId,
    TariffId,
    TransformArrayWith,
    TransformWith,
    url,
    Url
} from "@citrineos/base";

export class UpsertTariffRequest {

    @TransformWith(tariffId)
    id!: TariffId;

    stationId!: string;

    @TransformWith(countryCode)
    countryCode!: CountryCode;

    @TransformWith(partyId)
    partyId!: PartyId;

    @TransformWith(currency)
    currency!: Currency;

    @TransformWith(tariffType)
    type?: TariffType;

    @TransformArrayWith(Displaytext.displayText)
    tariffAltText?: Displaytext[];

    @TransformWith(url)
    tariffAltUrl?: Url;

    @TransformWith(value => new Price(value))
    minPrice?: Price;

    @TransformWith(value => new Price(value))
    maxPrice?: Price;

    elements!: TariffElement[];

    @TransformWith(value => new EnergyMix(value))
    energyMix?: EnergyMixData;

    @TransformWith(value => new Date(value))
    startDateTime?: Date;

    @TransformWith(value => new Date(value))
    endDateTime?: Date;

    @TransformWith(value => new Date(value))
    lastUpdated!: Date;

    authorizationAmount!: number;

}

