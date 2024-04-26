
import type { LocationDTO } from './LocationDTO';
import {
    LocationFromJSON,
    LocationFromJSONTyped,
    LocationToJSON,
} from './LocationDTO';
/**
 * 
 * @export
 * @interface OcpiResponseLocationDTO
 */
export interface OcpiResponseLocationDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseLocationDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseLocationDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {LocationDTO}
     * @memberof OcpiResponseLocationDTO
     */
    data?: LocationDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseLocationDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseLocation interface.
 */
export function instanceOfOcpiResponseLocation(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseLocationFromJSON(json: any): OcpiResponseLocationDTO {
    return OcpiResponseLocationFromJSONTyped(json, false);
}

export function OcpiResponseLocationFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseLocationDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : LocationFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseLocationToJSON(value?: OcpiResponseLocationDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': LocationToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

