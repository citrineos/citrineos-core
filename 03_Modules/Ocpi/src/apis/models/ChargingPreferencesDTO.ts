/**
 * 
 * @export
 * @interface ChargingPreferencesDTO
 */
export interface ChargingPreferencesDTO {
    /**
     * 
     * @type {string}
     * @memberof ChargingPreferencesDTO
     */
    profileType: ChargingPreferencesProfileTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof ChargingPreferencesDTO
     */
    departureTime?: string;
    /**
     * 
     * @type {number}
     * @memberof ChargingPreferencesDTO
     */
    energyNeed?: number;
    /**
     * 
     * @type {boolean}
     * @memberof ChargingPreferencesDTO
     */
    dischargeAllowed?: boolean;
}


/**
 * @export
 */
export const ChargingPreferencesProfileTypeEnum = {
    Cheap: 'CHEAP',
    Fast: 'FAST',
    Green: 'GREEN',
    Regular: 'REGULAR'
} as const;
export type ChargingPreferencesProfileTypeEnum = typeof ChargingPreferencesProfileTypeEnum[keyof typeof ChargingPreferencesProfileTypeEnum];


/**
 * Check if a given object implements the ChargingPreferences interface.
 */
export function instanceOfChargingPreferences(value: object): boolean {
    if (!('profileType' in value)) return false;
    return true;
}

export function ChargingPreferencesFromJSON(json: any): ChargingPreferencesDTO {
    return ChargingPreferencesFromJSONTyped(json, false);
}

export function ChargingPreferencesFromJSONTyped(json: any, ignoreDiscriminator: boolean): ChargingPreferencesDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'profileType': json['profile_type'],
        'departureTime': json['departure_time'] == null ? undefined : json['departure_time'],
        'energyNeed': json['energy_need'] == null ? undefined : json['energy_need'],
        'dischargeAllowed': json['discharge_allowed'] == null ? undefined : json['discharge_allowed'],
    };
}

export function ChargingPreferencesToJSON(value?: ChargingPreferencesDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'profile_type': value['profileType'],
        'departure_time': value['departureTime'],
        'energy_need': value['energyNeed'],
        'discharge_allowed': value['dischargeAllowed'],
    };
}

