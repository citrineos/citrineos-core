/**
 * 
 * @export
 * @interface EnergySourceDTO
 */
export interface EnergySourceDTO {
    /**
     * 
     * @type {string}
     * @memberof EnergySourceDTO
     */
    source: EnergySourceSourceEnum;
    /**
     * 
     * @type {number}
     * @memberof EnergySourceDTO
     */
    percentage: number;
}


/**
 * @export
 */
export const EnergySourceSourceEnum = {
    Nuclear: 'NUCLEAR',
    GeneralFossil: 'GENERAL_FOSSIL',
    Coal: 'COAL',
    Gas: 'GAS',
    GeneralGreen: 'GENERAL_GREEN',
    Solar: 'SOLAR',
    Wind: 'WIND',
    Water: 'WATER'
} as const;
export type EnergySourceSourceEnum = typeof EnergySourceSourceEnum[keyof typeof EnergySourceSourceEnum];


/**
 * Check if a given object implements the EnergySource interface.
 */
export function instanceOfEnergySource(value: object): boolean {
    if (!('source' in value)) return false;
    if (!('percentage' in value)) return false;
    return true;
}

export function EnergySourceFromJSON(json: any): EnergySourceDTO {
    return EnergySourceFromJSONTyped(json, false);
}

export function EnergySourceFromJSONTyped(json: any, ignoreDiscriminator: boolean): EnergySourceDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'source': json['source'],
        'percentage': json['percentage'],
    };
}

export function EnergySourceToJSON(value?: EnergySourceDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'source': value['source'],
        'percentage': value['percentage'],
    };
}

