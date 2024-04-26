
import type { DisplayTextDTO } from './DisplayTextDTO';
import {
    DisplayTextFromJSON,
    DisplayTextFromJSONTyped,
    DisplayTextToJSON,
} from './DisplayTextDTO';
/**
 * 
 * @export
 * @interface AdditionalGeoLocationDTO
 */
export interface AdditionalGeoLocationDTO {
    /**
     * 
     * @type {string}
     * @memberof AdditionalGeoLocationDTO
     */
    latitude: string;
    /**
     * 
     * @type {string}
     * @memberof AdditionalGeoLocationDTO
     */
    longitude: string;
    /**
     * 
     * @type {DisplayTextDTO}
     * @memberof AdditionalGeoLocationDTO
     */
    name?: DisplayTextDTO;
}

/**
 * Check if a given object implements the AdditionalGeoLocation interface.
 */
export function instanceOfAdditionalGeoLocation(value: object): boolean {
    if (!('latitude' in value)) return false;
    if (!('longitude' in value)) return false;
    return true;
}

export function AdditionalGeoLocationFromJSON(json: any): AdditionalGeoLocationDTO {
    return AdditionalGeoLocationFromJSONTyped(json, false);
}

export function AdditionalGeoLocationFromJSONTyped(json: any, ignoreDiscriminator: boolean): AdditionalGeoLocationDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'latitude': json['latitude'],
        'longitude': json['longitude'],
        'name': json['name'] == null ? undefined : DisplayTextFromJSON(json['name']),
    };
}

export function AdditionalGeoLocationToJSON(value?: AdditionalGeoLocationDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'latitude': value['latitude'],
        'longitude': value['longitude'],
        'name': DisplayTextToJSON(value['name']),
    };
}

