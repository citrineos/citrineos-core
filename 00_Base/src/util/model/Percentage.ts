import {assert, Brand} from "./global";

export type Percentage = Brand<number, 'Percentage'>;

export function isPercentage(value: number): value is Percentage {
    return value > 0 && value < 100;
}

export function percentage(value: number): Percentage {
    assert(isPercentage(value), `Invalid percentage: ${value}`);
    return value;
}
