import {assert} from "@citrineos/base";

export type TariffDimensionType = typeof TARIFF_DIMENSION_TYPES[number];

export function isTariffDimensionType(value: string): value is TariffDimensionType {
    return (TARIFF_DIMENSION_TYPES as readonly string[]).includes(value);
}

export function tariffDimensionType(value: string): TariffDimensionType {
    assert(isTariffDimensionType(value), `Invalid tariff dimension type: ${value}`);
    return value;
}

const TARIFF_DIMENSION_TYPES = [
    'ENERGY',
    'FLAT',
    'PARKING_TIME',
    'TIME',
] as const;
