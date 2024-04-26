/**
 * 
 * @export
 * @interface PublishTokenTypeDTO
 */
export interface PublishTokenTypeDTO {
    /**
     * 
     * @type {string}
     * @memberof PublishTokenTypeDTO
     */
    uid?: string;
    /**
     * 
     * @type {string}
     * @memberof PublishTokenTypeDTO
     */
    type?: PublishTokenTypeTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof PublishTokenTypeDTO
     */
    visualNumber?: string;
    /**
     * 
     * @type {string}
     * @memberof PublishTokenTypeDTO
     */
    issuer?: string;
    /**
     * 
     * @type {string}
     * @memberof PublishTokenTypeDTO
     */
    groupId?: string;
}


/**
 * @export
 */
export const PublishTokenTypeTypeEnum = {
    AdHocUser: 'AD_HOC_USER',
    AppUser: 'APP_USER',
    Other: 'OTHER',
    Rfid: 'RFID'
} as const;
export type PublishTokenTypeTypeEnum = typeof PublishTokenTypeTypeEnum[keyof typeof PublishTokenTypeTypeEnum];


/**
 * Check if a given object implements the PublishTokenType interface.
 */
export function instanceOfPublishTokenType(value: object): boolean {
    return true;
}

export function PublishTokenTypeFromJSON(json: any): PublishTokenTypeDTO {
    return PublishTokenTypeFromJSONTyped(json, false);
}

export function PublishTokenTypeFromJSONTyped(json: any, ignoreDiscriminator: boolean): PublishTokenTypeDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'uid': json['uid'] == null ? undefined : json['uid'],
        'type': json['type'] == null ? undefined : json['type'],
        'visualNumber': json['visual_number'] == null ? undefined : json['visual_number'],
        'issuer': json['issuer'] == null ? undefined : json['issuer'],
        'groupId': json['group_id '] == null ? undefined : json['group_id '],
    };
}

export function PublishTokenTypeToJSON(value?: PublishTokenTypeDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'uid': value['uid'],
        'type': value['type'],
        'visual_number': value['visualNumber'],
        'issuer': value['issuer'],
        'group_id ': value['groupId'],
    };
}

