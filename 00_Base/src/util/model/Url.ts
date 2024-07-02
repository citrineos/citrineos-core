import {assert, Brand} from "./global";
import {isLength, isURL} from 'validator';

export type Url = Brand<string, 'Url'>;

export function isUrl(value: string): value is Url {
    return isLength(value, {max: 255}) && isURL(value);
}

export function url(value: string): Url {
    assert(isUrl(value), `Invalid url: ${value}`);
    return value;
}
