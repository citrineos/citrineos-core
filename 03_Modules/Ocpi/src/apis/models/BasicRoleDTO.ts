/**
 *
 * @export
 * @interface BasicRoleDTO
 */
export interface BasicRoleDTO {
    /**
     *
     * @type {string}
     * @memberof BasicRoleDTO
     */
    partyId: string;
    /**
     *
     * @type {string}
     * @memberof BasicRoleDTO
     */
    countryCode: string;
}

/**
 * Check if a given object implements the BasicRole interface.
 */
export function instanceOfBasicRole(value: object): boolean {
    if (!('partyId' in value)) {
        return false;
    }
    if (!('countryCode' in value)) {
        return false;
    }
    return true;
}

export function BasicRoleFromJSON(json: any): BasicRoleDTO {
    return BasicRoleFromJSONTyped(json, false);
}

export function BasicRoleFromJSONTyped(json: any, ignoreDiscriminator: boolean): BasicRoleDTO {
    if (json == null) {
        return json;
    }
    return {

        'partyId': json['party_id'],
        'countryCode': json['country_code'],
    };
}

export function BasicRoleToJSON(value?: BasicRoleDTO | null): any {
    if (value == null) {
        return value;
    }
    return {

        'party_id': value['partyId'],
        'country_code': value['countryCode'],
    };
}

