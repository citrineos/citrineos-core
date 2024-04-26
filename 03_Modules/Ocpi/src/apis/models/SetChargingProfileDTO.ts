
import type { ChargingProfileDTO } from './ChargingProfileDTO';
import {
    ChargingProfileFromJSON,
    ChargingProfileFromJSONTyped,
    ChargingProfileToJSON,
} from './ChargingProfileDTO';
/**
 * 
 * @export
 * @interface SetChargingProfileDTO
 */
export interface SetChargingProfileDTO {
    /**
     * 
     * @type {ChargingProfileDTO}
     * @memberof SetChargingProfileDTO
     */
    chargingProfile: ChargingProfileDTO;
    /**
     * 
     * @type {string}
     * @memberof SetChargingProfileDTO
     */
    responseUrl: string;
}

/**
 * Check if a given object implements the SetChargingProfile interface.
 */
export function instanceOfSetChargingProfile(value: object): boolean {
    if (!('chargingProfile' in value)) return false;
    if (!('responseUrl' in value)) return false;
    return true;
}

export function SetChargingProfileFromJSON(json: any): SetChargingProfileDTO {
    return SetChargingProfileFromJSONTyped(json, false);
}

export function SetChargingProfileFromJSONTyped(json: any, ignoreDiscriminator: boolean): SetChargingProfileDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'chargingProfile': ChargingProfileFromJSON(json['charging_profile']),
        'responseUrl': json['response_url'],
    };
}

export function SetChargingProfileToJSON(value?: SetChargingProfileDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'charging_profile': ChargingProfileToJSON(value['chargingProfile']),
        'response_url': value['responseUrl'],
    };
}

