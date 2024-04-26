/**
 * 
 * @export
 * @interface LocationReferencesDTO
 */
export interface LocationReferencesDTO {
    /**
     * 
     * @type {string}
     * @memberof LocationReferencesDTO
     */
    locationId: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof LocationReferencesDTO
     */
    evseUids?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof LocationReferencesDTO
     */
    connectorIds?: Array<string>;
}

/**
 * Check if a given object implements the LocationReferences interface.
 */
export function instanceOfLocationReferences(value: object): boolean {
    if (!('locationId' in value)) return false;
    return true;
}

export function LocationReferencesFromJSON(json: any): LocationReferencesDTO {
    return LocationReferencesFromJSONTyped(json, false);
}

export function LocationReferencesFromJSONTyped(json: any, ignoreDiscriminator: boolean): LocationReferencesDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'locationId': json['location_id'],
        'evseUids': json['evse_uids'] == null ? undefined : json['evse_uids'],
        'connectorIds': json['connector_ids'] == null ? undefined : json['connector_ids'],
    };
}

export function LocationReferencesToJSON(value?: LocationReferencesDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'location_id': value['locationId'],
        'evse_uids': value['evseUids'],
        'connector_ids': value['connectorIds'],
    };
}

