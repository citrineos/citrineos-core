/**
 *
 * @export
 * @interface CdrDimensionDTO
 */
export interface CdrDimensionDTO {
    /**
     *
     * @type {string}
     * @memberof CdrDimensionDTO
     */
    type: CdrDimensionTypeEnum;
    /**
     *
     * @type {number}
     * @memberof CdrDimensionDTO
     */
    volume: number;
}


/**
 * @export
 */
export const CdrDimensionTypeEnum = {
    Current: 'CURRENT',
    Energy: 'ENERGY',
    EnergyExport: 'ENERGY_EXPORT',
    EnergyImport: 'ENERGY_IMPORT',
    MaxCurrent: 'MAX_CURRENT',
    MinCurrent: 'MIN_CURRENT',
    MaxPower: 'MAX_POWER',
    MinPower: 'MIN_POWER',
    ParkingTime: 'PARKING_TIME',
    Power: 'POWER',
    ReservationTime: 'RESERVATION_TIME',
    StateOfCharge: 'STATE_OF_CHARGE',
    Time: 'TIME'
} as const;
export type CdrDimensionTypeEnum = typeof CdrDimensionTypeEnum[keyof typeof CdrDimensionTypeEnum];


/**
 * Check if a given object implements the CdrDimension interface.
 */
export function instanceOfCdrDimension(value: object): boolean {
    if (!('type' in value)) {
        return false;
    }
    if (!('volume' in value)) {
        return false;
    }
    return true;
}

export function CdrDimensionFromJSON(json: any): CdrDimensionDTO {
    return CdrDimensionFromJSONTyped(json, false);
}

export function CdrDimensionFromJSONTyped(json: any, ignoreDiscriminator: boolean): CdrDimensionDTO {
    if (json == null) {
        return json;
    }
    return {

        'type': json['type'],
        'volume': json['volume'],
    };
}

export function CdrDimensionToJSON(value?: CdrDimensionDTO | null): any {
    if (value == null) {
        return value;
    }
    return {

        'type': value['type'],
        'volume': value['volume'],
    };
}

