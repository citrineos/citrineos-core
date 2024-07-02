import {assert, Brand} from "./global";
import {isLength} from "validator";

export type ShortName = Brand<string, 'ShortName'>;

export function isShortName(value: string): value is ShortName {
    return isLength(value, {max: 64});
}

export function shortName(value: string): ShortName {
    assert(isShortName(value), `Invalid name: ${value}`);
    return value;
}
