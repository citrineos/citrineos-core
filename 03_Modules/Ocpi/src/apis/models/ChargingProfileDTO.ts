
import type { ChargingProfilePeriodDTO } from './ChargingProfilePeriodDTO';
import {
    ChargingProfilePeriodFromJSON,
    ChargingProfilePeriodFromJSONTyped,
    ChargingProfilePeriodToJSON,
} from './ChargingProfilePeriodDTO';
/**
 * 
 * @export
 * @interface ChargingProfileDTO
 */
export interface ChargingProfileDTO {
    /**
     * 
     * @type {string}
     * @memberof ChargingProfileDTO
     */
    startDateTime?: string;
    /**
     * 
     * @type {number}
     * @memberof ChargingProfileDTO
     */
    duration?: number;
    /**
     * 
     * @type {string}
     * @memberof ChargingProfileDTO
     */
    chargingRateUnit: ChargingProfileChargingRateUnitEnum;
    /**
     * 
     * @type {number}
     * @memberof ChargingProfileDTO
     */
    minChargingRate?: number;
    /**
     * 
     * @type {Array<ChargingProfilePeriodDTO>}
     * @memberof ChargingProfileDTO
     */
    chargingProfilePeriod?: Array<ChargingProfilePeriodDTO>;
}


/**
 * @export
 */
export const ChargingProfileChargingRateUnitEnum = {
    W: 'W',
    A: 'A'
} as const;
export type ChargingProfileChargingRateUnitEnum = typeof ChargingProfileChargingRateUnitEnum[keyof typeof ChargingProfileChargingRateUnitEnum];


/**
 * Check if a given object implements the ChargingProfile interface.
 */
export function instanceOfChargingProfile(value: object): boolean {
    if (!('chargingRateUnit' in value)) return false;
    return true;
}

export function ChargingProfileFromJSON(json: any): ChargingProfileDTO {
    return ChargingProfileFromJSONTyped(json, false);
}

export function ChargingProfileFromJSONTyped(json: any, ignoreDiscriminator: boolean): ChargingProfileDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'startDateTime': json['start_date_time'] == null ? undefined : json['start_date_time'],
        'duration': json['duration'] == null ? undefined : json['duration'],
        'chargingRateUnit': json['charging_rate_unit'],
        'minChargingRate': json['min_charging_rate'] == null ? undefined : json['min_charging_rate'],
        'chargingProfilePeriod': json['charging_profile_period'] == null ? undefined : ((json['charging_profile_period'] as Array<any>).map(ChargingProfilePeriodFromJSON)),
    };
}

export function ChargingProfileToJSON(value?: ChargingProfileDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'start_date_time': value['startDateTime'],
        'duration': value['duration'],
        'charging_rate_unit': value['chargingRateUnit'],
        'min_charging_rate': value['minChargingRate'],
        'charging_profile_period': value['chargingProfilePeriod'] == null ? undefined : ((value['chargingProfilePeriod'] as Array<any>).map(ChargingProfilePeriodToJSON)),
    };
}

