import {assert, Brand} from "./global";
import {isLength} from "validator";
import {CountryCode} from "./CountryCode";
import {PartyId} from "./PartyId";

export type TariffId = Brand<string, 'TariffId'>;

export function isTariffId(value: string): value is TariffId {
    return isLength(value, {max: 36});
}

export function tariffId(value: string): TariffId {
    assert(isTariffId(value), `Invalid tariff id: ${value}`);
    return value;
}

export type TariffKey = {
    id: TariffId;
    countryCode: CountryCode;
    partyId: PartyId;
};
