
import type { TokenDTO } from './TokenDTO';
import {
    TokenFromJSON,
    TokenFromJSONTyped,
    TokenToJSON,
} from './TokenDTO';
/**
 * 
 * @export
 * @interface StartSessionDTO
 */
export interface StartSessionDTO {
    /**
     * 
     * @type {string}
     * @memberof StartSessionDTO
     */
    responseUrl: string;
    /**
     * 
     * @type {TokenDTO}
     * @memberof StartSessionDTO
     */
    token: TokenDTO;
    /**
     * 
     * @type {string}
     * @memberof StartSessionDTO
     */
    locationId: string;
    /**
     * 
     * @type {string}
     * @memberof StartSessionDTO
     */
    evseUid?: string;
    /**
     * 
     * @type {string}
     * @memberof StartSessionDTO
     */
    authorizationReference?: string;
}

/**
 * Check if a given object implements the StartSession interface.
 */
export function instanceOfStartSession(value: object): boolean {
    if (!('responseUrl' in value)) return false;
    if (!('token' in value)) return false;
    if (!('locationId' in value)) return false;
    return true;
}

export function StartSessionFromJSON(json: any): StartSessionDTO {
    return StartSessionFromJSONTyped(json, false);
}

export function StartSessionFromJSONTyped(json: any, ignoreDiscriminator: boolean): StartSessionDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'responseUrl': json['response_url'],
        'token': TokenFromJSON(json['token']),
        'locationId': json['location_id'],
        'evseUid': json['evse_uid'] == null ? undefined : json['evse_uid'],
        'authorizationReference': json['authorization_reference'] == null ? undefined : json['authorization_reference'],
    };
}

export function StartSessionToJSON(value?: StartSessionDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'response_url': value['responseUrl'],
        'token': TokenToJSON(value['token']),
        'location_id': value['locationId'],
        'evse_uid': value['evseUid'],
        'authorization_reference': value['authorizationReference'],
    };
}

