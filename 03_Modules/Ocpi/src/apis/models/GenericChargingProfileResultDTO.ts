
import type { ActiveChargingProfileDTO } from './ActiveChargingProfileDTO';
import {
    ActiveChargingProfileFromJSON,
    ActiveChargingProfileFromJSONTyped,
    ActiveChargingProfileToJSON,
} from './ActiveChargingProfileDTO';
/**
 * 
 * @export
 * @interface GenericChargingProfileResultDTO
 */
export interface GenericChargingProfileResultDTO {
    /**
     * 
     * @type {string}
     * @memberof GenericChargingProfileResultDTO
     */
    result: GenericChargingProfileResultResultEnum;
    /**
     * 
     * @type {ActiveChargingProfileDTO}
     * @memberof GenericChargingProfileResultDTO
     */
    profile?: ActiveChargingProfileDTO;
}


/**
 * @export
 */
export const GenericChargingProfileResultResultEnum = {
    Accepted: 'ACCEPTED',
    Rejected: 'REJECTED',
    Unknown: 'UNKNOWN'
} as const;
export type GenericChargingProfileResultResultEnum = typeof GenericChargingProfileResultResultEnum[keyof typeof GenericChargingProfileResultResultEnum];


/**
 * Check if a given object implements the GenericChargingProfileResult interface.
 */
export function instanceOfGenericChargingProfileResult(value: object): boolean {
    if (!('result' in value)) return false;
    return true;
}

export function GenericChargingProfileResultFromJSON(json: any): GenericChargingProfileResultDTO {
    return GenericChargingProfileResultFromJSONTyped(json, false);
}

export function GenericChargingProfileResultFromJSONTyped(json: any, ignoreDiscriminator: boolean): GenericChargingProfileResultDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'result': json['result'],
        'profile': json['profile'] == null ? undefined : ActiveChargingProfileFromJSON(json['profile']),
    };
}

export function GenericChargingProfileResultToJSON(value?: GenericChargingProfileResultDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'result': value['result'],
        'profile': ActiveChargingProfileToJSON(value['profile']),
    };
}

