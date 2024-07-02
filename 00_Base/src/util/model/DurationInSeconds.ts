import {assert, Brand} from "./global";

export type DurationInSeconds = Brand<number, 'DurationInSeconds'>;

export function isDurationInSeconds(value: number): value is DurationInSeconds {
    return Number.isInteger(value) && value > 0;
}

export function durationInSeconds(value: number): DurationInSeconds {
    assert(isDurationInSeconds(value), `Invalid duration: ${value}`);
    return value;
}
