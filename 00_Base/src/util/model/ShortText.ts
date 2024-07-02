import {assert, Brand} from "./global";
import {isLength} from 'validator';

export type ShortText = Brand<string, 'ShortText'>;

export function isShortText(value: string): value is ShortText {
    return isLength(value, {max: 512});
}

export function shortText(value: string): ShortText {
    assert(isShortText(value), `Invalid text: ${value}`);
    return value;
}
