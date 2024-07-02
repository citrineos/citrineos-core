import {YearMonthDay} from "./DateOnly";
import {HourMinute} from "./HourMinute";

export type StartEndRange<T extends string, V> = {
    [K in Capitalize<T> as `start${K}`]?: V;
} & {
    [K in Capitalize<T> as `end${K}`]?: V;
};

export type TimeRange = StartEndRange<'time', HourMinute>;
export type DateRange = StartEndRange<'date', YearMonthDay>;
