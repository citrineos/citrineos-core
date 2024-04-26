
import type { TokenDTO } from './TokenDTO';
import {
    TokenFromJSON,
    TokenFromJSONTyped,
    TokenToJSON,
} from './TokenDTO';
/**
 * 
 * @export
 * @interface ReserveNowDTO
 */
export interface ReserveNowDTO {
    /**
     * 
     * @type {string}
     * @memberof ReserveNowDTO
     */
    responseUrl: string;
    /**
     * 
     * @type {TokenDTO}
     * @memberof ReserveNowDTO
     */
    token: TokenDTO;
    /**
     * 
     * @type {string}
     * @memberof ReserveNowDTO
     */
    expiryDate: string;
    /**
     * 
     * @type {string}
     * @memberof ReserveNowDTO
     */
    reservationId: string;
    /**
     * 
     * @type {string}
     * @memberof ReserveNowDTO
     */
    locationId: string;
    /**
     * 
     * @type {string}
     * @memberof ReserveNowDTO
     */
    evseUid?: string;
    /**
     * 
     * @type {string}
     * @memberof ReserveNowDTO
     */
    authorizationReference?: string;
}

/**
 * Check if a given object implements the ReserveNow interface.
 */
export function instanceOfReserveNow(value: object): boolean {
    if (!('responseUrl' in value)) return false;
    if (!('token' in value)) return false;
    if (!('expiryDate' in value)) return false;
    if (!('reservationId' in value)) return false;
    if (!('locationId' in value)) return false;
    return true;
}

export function ReserveNowFromJSON(json: any): ReserveNowDTO {
    return ReserveNowFromJSONTyped(json, false);
}

export function ReserveNowFromJSONTyped(json: any, ignoreDiscriminator: boolean): ReserveNowDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'responseUrl': json['response_url'],
        'token': TokenFromJSON(json['token']),
        'expiryDate': json['expiry_date'],
        'reservationId': json['reservation_id'],
        'locationId': json['location_id'],
        'evseUid': json['evse_uid'] == null ? undefined : json['evse_uid'],
        'authorizationReference': json['authorization_reference'] == null ? undefined : json['authorization_reference'],
    };
}

export function ReserveNowToJSON(value?: ReserveNowDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'response_url': value['responseUrl'],
        'token': TokenToJSON(value['token']),
        'expiry_date': value['expiryDate'],
        'reservation_id': value['reservationId'],
        'location_id': value['locationId'],
        'evse_uid': value['evseUid'],
        'authorization_reference': value['authorizationReference'],
    };
}

