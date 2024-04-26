/**
 * 
 * @export
 * @interface ChargingProfilePeriodDTO
 */
export interface ChargingProfilePeriodDTO {
    /**
     * 
     * @type {number}
     * @memberof ChargingProfilePeriodDTO
     */
    startPeriod: number;
    /**
     * 
     * @type {number}
     * @memberof ChargingProfilePeriodDTO
     */
    limit: number;
}

/**
 * Check if a given object implements the ChargingProfilePeriod interface.
 */
export function instanceOfChargingProfilePeriod(value: object): boolean {
    if (!('startPeriod' in value)) return false;
    if (!('limit' in value)) return false;
    return true;
}

export function ChargingProfilePeriodFromJSON(json: any): ChargingProfilePeriodDTO {
    return ChargingProfilePeriodFromJSONTyped(json, false);
}

export function ChargingProfilePeriodFromJSONTyped(json: any, ignoreDiscriminator: boolean): ChargingProfilePeriodDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'startPeriod': json['start_period'],
        'limit': json['limit'],
    };
}

export function ChargingProfilePeriodToJSON(value?: ChargingProfilePeriodDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'start_period': value['startPeriod'],
        'limit': value['limit'],
    };
}

