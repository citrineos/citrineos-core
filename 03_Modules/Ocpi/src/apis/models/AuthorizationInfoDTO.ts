
import type { DisplayTextDTO } from './DisplayTextDTO';
import {
    DisplayTextFromJSON,
    DisplayTextFromJSONTyped,
    DisplayTextToJSON,
} from './DisplayTextDTO';
import type { LocationReferencesDTO } from './LocationReferencesDTO';
import {
    LocationReferencesFromJSON,
    LocationReferencesFromJSONTyped,
    LocationReferencesToJSON,
} from './LocationReferencesDTO';
import type { TokenDTO } from './TokenDTO';
import {
    TokenFromJSON,
    TokenFromJSONTyped,
    TokenToJSON,
} from './TokenDTO';
/**
 * 
 * @export
 * @interface AuthorizationInfoDTO
 */
export interface AuthorizationInfoDTO {
    /**
     * 
     * @type {string}
     * @memberof AuthorizationInfoDTO
     */
    allowed: AuthorizationInfoAllowedEnum;
    /**
     * 
     * @type {TokenDTO}
     * @memberof AuthorizationInfoDTO
     */
    token: TokenDTO;
    /**
     * 
     * @type {LocationReferencesDTO}
     * @memberof AuthorizationInfoDTO
     */
    location?: LocationReferencesDTO;
    /**
     * 
     * @type {string}
     * @memberof AuthorizationInfoDTO
     */
    authorizationReference?: string;
    /**
     * 
     * @type {DisplayTextDTO}
     * @memberof AuthorizationInfoDTO
     */
    info?: DisplayTextDTO;
}


/**
 * @export
 */
export const AuthorizationInfoAllowedEnum = {
    Allowed: 'ALLOWED',
    Blocked: 'BLOCKED',
    Expired: 'EXPIRED',
    NoCredit: 'NO_CREDIT',
    NotAllowed: 'NOT_ALLOWED'
} as const;
export type AuthorizationInfoAllowedEnum = typeof AuthorizationInfoAllowedEnum[keyof typeof AuthorizationInfoAllowedEnum];


/**
 * Check if a given object implements the AuthorizationInfo interface.
 */
export function instanceOfAuthorizationInfo(value: object): boolean {
    if (!('allowed' in value)) return false;
    if (!('token' in value)) return false;
    return true;
}

export function AuthorizationInfoFromJSON(json: any): AuthorizationInfoDTO {
    return AuthorizationInfoFromJSONTyped(json, false);
}

export function AuthorizationInfoFromJSONTyped(json: any, ignoreDiscriminator: boolean): AuthorizationInfoDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'allowed': json['allowed'],
        'token': TokenFromJSON(json['token']),
        'location': json['location'] == null ? undefined : LocationReferencesFromJSON(json['location']),
        'authorizationReference': json['authorization_reference'] == null ? undefined : json['authorization_reference'],
        'info': json['info'] == null ? undefined : DisplayTextFromJSON(json['info']),
    };
}

export function AuthorizationInfoToJSON(value?: AuthorizationInfoDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'allowed': value['allowed'],
        'token': TokenToJSON(value['token']),
        'location': LocationReferencesToJSON(value['location']),
        'authorization_reference': value['authorizationReference'],
        'info': DisplayTextToJSON(value['info']),
    };
}

