/**
 * 
 * @export
 * @interface GeoLocationDTO
 */
export interface GeoLocationDTO {
    /**
     * 
     * @type {string}
     * @memberof GeoLocationDTO
     */
    latitude: string;
    /**
     * 
     * @type {string}
     * @memberof GeoLocationDTO
     */
    longitude: string;
}

/**
 * Check if a given object implements the GeoLocation interface.
 */
export function instanceOfGeoLocation(value: object): boolean {
    if (!('latitude' in value)) return false;
    if (!('longitude' in value)) return false;
    return true;
}

export function GeoLocationFromJSON(json: any): GeoLocationDTO {
    return GeoLocationFromJSONTyped(json, false);
}

export function GeoLocationFromJSONTyped(json: any, ignoreDiscriminator: boolean): GeoLocationDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'latitude': json['latitude'],
        'longitude': json['longitude'],
    };
}

export function GeoLocationToJSON(value?: GeoLocationDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'latitude': value['latitude'],
        'longitude': value['longitude'],
    };
}

