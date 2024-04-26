/**
 * 
 * @export
 * @interface CdrTokenDTO
 */
export interface CdrTokenDTO {
    /**
     * 
     * @type {string}
     * @memberof CdrTokenDTO
     */
    uid: string;
    /**
     * 
     * @type {string}
     * @memberof CdrTokenDTO
     */
    type: CdrTokenTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof CdrTokenDTO
     */
    contractId: string;
}


/**
 * @export
 */
export const CdrTokenTypeEnum = {
    AdHocUser: 'AD_HOC_USER',
    AppUser: 'APP_USER',
    Other: 'OTHER',
    Rfid: 'RFID'
} as const;
export type CdrTokenTypeEnum = typeof CdrTokenTypeEnum[keyof typeof CdrTokenTypeEnum];


/**
 * Check if a given object implements the CdrToken interface.
 */
export function instanceOfCdrToken(value: object): boolean {
    if (!('uid' in value)) return false;
    if (!('type' in value)) return false;
    if (!('contractId' in value)) return false;
    return true;
}

export function CdrTokenFromJSON(json: any): CdrTokenDTO {
    return CdrTokenFromJSONTyped(json, false);
}

export function CdrTokenFromJSONTyped(json: any, ignoreDiscriminator: boolean): CdrTokenDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'uid': json['uid'],
        'type': json['type'],
        'contractId': json['contract_id'],
    };
}

export function CdrTokenToJSON(value?: CdrTokenDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'uid': value['uid'],
        'type': value['type'],
        'contract_id': value['contractId'],
    };
}

