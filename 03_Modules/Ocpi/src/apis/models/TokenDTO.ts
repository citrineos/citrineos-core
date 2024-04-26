
import type { EnergyContractDTO } from './EnergyContractDTO';
import {
    EnergyContractFromJSON,
    EnergyContractFromJSONTyped,
    EnergyContractToJSON,
} from './EnergyContractDTO';
/**
 * 
 * @export
 * @interface TokenDTO
 */
export interface TokenDTO {
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    countryCode: string;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    partyId: string;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    uid: string;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    type: TokenTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    contractId: string;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    visualNumber?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    issuer: string;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    groupId?: string;
    /**
     * 
     * @type {boolean}
     * @memberof TokenDTO
     */
    valid: boolean;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    whitelist: TokenWhitelistEnum;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    language?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    defaultProfileType?: TokenDefaultProfileTypeEnum;
    /**
     * 
     * @type {EnergyContractDTO}
     * @memberof TokenDTO
     */
    energyContract?: EnergyContractDTO;
    /**
     * 
     * @type {string}
     * @memberof TokenDTO
     */
    lastUpdated: string;
}


/**
 * @export
 */
export const TokenTypeEnum = {
    AdHocUser: 'AD_HOC_USER',
    AppUser: 'APP_USER',
    Other: 'OTHER',
    Rfid: 'RFID'
} as const;
export type TokenTypeEnum = typeof TokenTypeEnum[keyof typeof TokenTypeEnum];

/**
 * @export
 */
export const TokenWhitelistEnum = {
    Always: 'ALWAYS',
    Allowed: 'ALLOWED',
    AllowedOffline: 'ALLOWED_OFFLINE',
    Never: 'NEVER'
} as const;
export type TokenWhitelistEnum = typeof TokenWhitelistEnum[keyof typeof TokenWhitelistEnum];

/**
 * @export
 */
export const TokenDefaultProfileTypeEnum = {
    Cheap: 'CHEAP',
    Fast: 'FAST',
    Green: 'GREEN',
    Regular: 'REGULAR'
} as const;
export type TokenDefaultProfileTypeEnum = typeof TokenDefaultProfileTypeEnum[keyof typeof TokenDefaultProfileTypeEnum];


/**
 * Check if a given object implements the Token interface.
 */
export function instanceOfToken(value: object): boolean {
    if (!('countryCode' in value)) return false;
    if (!('partyId' in value)) return false;
    if (!('uid' in value)) return false;
    if (!('type' in value)) return false;
    if (!('contractId' in value)) return false;
    if (!('issuer' in value)) return false;
    if (!('valid' in value)) return false;
    if (!('whitelist' in value)) return false;
    if (!('lastUpdated' in value)) return false;
    return true;
}

export function TokenFromJSON(json: any): TokenDTO {
    return TokenFromJSONTyped(json, false);
}

export function TokenFromJSONTyped(json: any, ignoreDiscriminator: boolean): TokenDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'countryCode': json['country_code'],
        'partyId': json['party_id'],
        'uid': json['uid'],
        'type': json['type'],
        'contractId': json['contract_id'],
        'visualNumber': json['visual_number'] == null ? undefined : json['visual_number'],
        'issuer': json['issuer'],
        'groupId': json['group_id'] == null ? undefined : json['group_id'],
        'valid': json['valid'],
        'whitelist': json['whitelist'],
        'language': json['language'] == null ? undefined : json['language'],
        'defaultProfileType': json['default_profile_type'] == null ? undefined : json['default_profile_type'],
        'energyContract': json['energy_contract'] == null ? undefined : EnergyContractFromJSON(json['energy_contract']),
        'lastUpdated': json['last_updated'],
    };
}

export function TokenToJSON(value?: TokenDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'country_code': value['countryCode'],
        'party_id': value['partyId'],
        'uid': value['uid'],
        'type': value['type'],
        'contract_id': value['contractId'],
        'visual_number': value['visualNumber'],
        'issuer': value['issuer'],
        'group_id': value['groupId'],
        'valid': value['valid'],
        'whitelist': value['whitelist'],
        'language': value['language'],
        'default_profile_type': value['defaultProfileType'],
        'energy_contract': EnergyContractToJSON(value['energyContract']),
        'last_updated': value['lastUpdated'],
    };
}

