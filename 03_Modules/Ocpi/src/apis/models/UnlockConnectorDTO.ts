/**
 * 
 * @export
 * @interface UnlockConnectorDTO
 */
export interface UnlockConnectorDTO {
    /**
     * 
     * @type {string}
     * @memberof UnlockConnectorDTO
     */
    responseUrl: string;
    /**
     * 
     * @type {string}
     * @memberof UnlockConnectorDTO
     */
    locationId: string;
    /**
     * 
     * @type {string}
     * @memberof UnlockConnectorDTO
     */
    evseUid: string;
    /**
     * 
     * @type {string}
     * @memberof UnlockConnectorDTO
     */
    connectorId: string;
}

/**
 * Check if a given object implements the UnlockConnector interface.
 */
export function instanceOfUnlockConnector(value: object): boolean {
    if (!('responseUrl' in value)) return false;
    if (!('locationId' in value)) return false;
    if (!('evseUid' in value)) return false;
    if (!('connectorId' in value)) return false;
    return true;
}

export function UnlockConnectorFromJSON(json: any): UnlockConnectorDTO {
    return UnlockConnectorFromJSONTyped(json, false);
}

export function UnlockConnectorFromJSONTyped(json: any, ignoreDiscriminator: boolean): UnlockConnectorDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'responseUrl': json['response_url'],
        'locationId': json['location_id'],
        'evseUid': json['evse_uid'],
        'connectorId': json['connector_id'],
    };
}

export function UnlockConnectorToJSON(value?: UnlockConnectorDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'response_url': value['responseUrl'],
        'location_id': value['locationId'],
        'evse_uid': value['evseUid'],
        'connector_id': value['connectorId'],
    };
}

