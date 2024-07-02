import {assert} from "./global";

export const ALL_DAYS_OF_WEEK = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
] as const;

export type DayOfWeek = typeof ALL_DAYS_OF_WEEK[number];

function isDayOfWeek(value: string): value is DayOfWeek {
    return (ALL_DAYS_OF_WEEK as readonly string[]).includes(value);
}

export function dayOfWeek(value: string): DayOfWeek {
    assert(isDayOfWeek(value), `Invalid day of week: ${value}`);
    return value;
}
