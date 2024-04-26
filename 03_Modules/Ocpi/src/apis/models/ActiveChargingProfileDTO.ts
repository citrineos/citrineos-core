
import type { ChargingProfileDTO } from './ChargingProfileDTO';
import {
    ChargingProfileFromJSON,
    ChargingProfileFromJSONTyped,
    ChargingProfileToJSON,
} from './ChargingProfileDTO';
/**
 * 
 * @export
 * @interface ActiveChargingProfileDTO
 */
export interface ActiveChargingProfileDTO {
    /**
     * 
     * @type {string}
     * @memberof ActiveChargingProfileDTO
     */
    startDateTime: string;
    /**
     * 
     * @type {ChargingProfileDTO}
     * @memberof ActiveChargingProfileDTO
     */
    chargingProfile: ChargingProfileDTO;
}

/**
 * Check if a given object implements the ActiveChargingProfile interface.
 */
export function instanceOfActiveChargingProfile(value: object): boolean {
    if (!('startDateTime' in value)) return false;
    if (!('chargingProfile' in value)) return false;
    return true;
}

export function ActiveChargingProfileFromJSON(json: any): ActiveChargingProfileDTO {
    return ActiveChargingProfileFromJSONTyped(json, false);
}

export function ActiveChargingProfileFromJSONTyped(json: any, ignoreDiscriminator: boolean): ActiveChargingProfileDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'startDateTime': json['start_date_time'],
        'chargingProfile': ChargingProfileFromJSON(json['charging_profile']),
    };
}

export function ActiveChargingProfileToJSON(value?: ActiveChargingProfileDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'start_date_time': value['startDateTime'],
        'charging_profile': ChargingProfileToJSON(value['chargingProfile']),
    };
}

