
import type { BusinessDetailsDTO } from './BusinessDetailsDTO';
import {
    BusinessDetailsFromJSON,
    BusinessDetailsFromJSONTyped,
    BusinessDetailsToJSON,
} from './BusinessDetailsDTO';
/**
 * 
 * @export
 * @interface CredentialsRoleDTO
 */
export interface CredentialsRoleDTO {
    /**
     * 
     * @type {string}
     * @memberof CredentialsRoleDTO
     */
    role: CredentialsRoleRoleEnum;
    /**
     * 
     * @type {BusinessDetailsDTO}
     * @memberof CredentialsRoleDTO
     */
    businessDetails: BusinessDetailsDTO;
    /**
     * 
     * @type {string}
     * @memberof CredentialsRoleDTO
     */
    partyId: string;
    /**
     * 
     * @type {string}
     * @memberof CredentialsRoleDTO
     */
    countryCode: string;
}


/**
 * @export
 */
export const CredentialsRoleRoleEnum = {
    Cpo: 'CPO',
    Emsp: 'EMSP',
    Hub: 'HUB',
    Nap: 'NAP',
    Nsp: 'NSP',
    Other: 'OTHER',
    Scsp: 'SCSP'
} as const;
export type CredentialsRoleRoleEnum = typeof CredentialsRoleRoleEnum[keyof typeof CredentialsRoleRoleEnum];


/**
 * Check if a given object implements the CredentialsRole interface.
 */
export function instanceOfCredentialsRole(value: object): boolean {
    if (!('role' in value)) return false;
    if (!('businessDetails' in value)) return false;
    if (!('partyId' in value)) return false;
    if (!('countryCode' in value)) return false;
    return true;
}

export function CredentialsRoleFromJSON(json: any): CredentialsRoleDTO {
    return CredentialsRoleFromJSONTyped(json, false);
}

export function CredentialsRoleFromJSONTyped(json: any, ignoreDiscriminator: boolean): CredentialsRoleDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'role': json['role'],
        'businessDetails': BusinessDetailsFromJSON(json['business_details']),
        'partyId': json['party_id'],
        'countryCode': json['country_code'],
    };
}

export function CredentialsRoleToJSON(value?: CredentialsRoleDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'role': value['role'],
        'business_details': BusinessDetailsToJSON(value['businessDetails']),
        'party_id': value['partyId'],
        'country_code': value['countryCode'],
    };
}

