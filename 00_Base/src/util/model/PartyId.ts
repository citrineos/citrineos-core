import {assert, Brand} from "./global";
import {Transform} from "class-transformer";

const partyIdPattern = /^[A-Z0-9]{1,3}$/;
export type PartyId = Brand<string, 'PartyId'>;

export function isPartyId(value: string): value is PartyId {
    return partyIdPattern.test(value);
}

export function partyId(value: string): PartyId {
    assert(isPartyId(value), `Invalid party id: ${value}`);
    return value;
}

export function TransformWith(creator: (value: any) => any): PropertyDecorator {
    return Transform(({value}) => creator(value));
}

export function TransformArrayWith(creator: (value: any) => any): PropertyDecorator {
    return Transform(({value}) => (value as any[]).map(item => creator(item)));
}
