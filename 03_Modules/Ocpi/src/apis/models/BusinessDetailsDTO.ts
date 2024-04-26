
import type { ImageDTO } from './ImageDTO';
import {
    ImageFromJSON,
    ImageFromJSONTyped,
    ImageToJSON,
} from './ImageDTO';
/**
 * 
 * @export
 * @interface BusinessDetailsDTO
 */
export interface BusinessDetailsDTO {
    /**
     * 
     * @type {string}
     * @memberof BusinessDetailsDTO
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof BusinessDetailsDTO
     */
    website?: string;
    /**
     * 
     * @type {ImageDTO}
     * @memberof BusinessDetailsDTO
     */
    logo?: ImageDTO;
}

/**
 * Check if a given object implements the BusinessDetails interface.
 */
export function instanceOfBusinessDetails(value: object): boolean {
    if (!('name' in value)) return false;
    return true;
}

export function BusinessDetailsFromJSON(json: any): BusinessDetailsDTO {
    return BusinessDetailsFromJSONTyped(json, false);
}

export function BusinessDetailsFromJSONTyped(json: any, ignoreDiscriminator: boolean): BusinessDetailsDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'name': json['name'],
        'website': json['website'] == null ? undefined : json['website'],
        'logo': json['logo'] == null ? undefined : ImageFromJSON(json['logo']),
    };
}

export function BusinessDetailsToJSON(value?: BusinessDetailsDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'name': value['name'],
        'website': value['website'],
        'logo': ImageToJSON(value['logo']),
    };
}

