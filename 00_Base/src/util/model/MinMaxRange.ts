import {DurationInSeconds} from "./DurationInSeconds";

export type MinMaxRange<T extends string, V> = {
    [K in Capitalize<T> as `min${K}`]?: V;
} & {
    [K in Capitalize<T> as `max${K}`]?: V;
};

export type KilowattHourRange = MinMaxRange<'kwh', number>;
export type ElectricCurrentRange = MinMaxRange<'current', number>;
export type PowerRange = MinMaxRange<'power', number>;
export type DurationRange = MinMaxRange<'duration', DurationInSeconds>;
