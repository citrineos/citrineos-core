
import type { LocationDTO } from './LocationDTO';
import {
    LocationFromJSON,
    LocationFromJSONTyped,
    LocationToJSON,
} from './LocationDTO';
/**
 * 
 * @export
 * @interface OcpiResponseLocationListDTO
 */
export interface OcpiResponseLocationListDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseLocationListDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseLocationListDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {Array<LocationDTO>}
     * @memberof OcpiResponseLocationListDTO
     */
    data?: Array<LocationDTO>;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseLocationListDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseLocationList interface.
 */
export function instanceOfOcpiResponseLocationList(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseLocationListFromJSON(json: any): OcpiResponseLocationListDTO {
    return OcpiResponseLocationListFromJSONTyped(json, false);
}

export function OcpiResponseLocationListFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseLocationListDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : ((json['data'] as Array<any>).map(LocationFromJSON)),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseLocationListToJSON(value?: OcpiResponseLocationListDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': value['data'] == null ? undefined : ((value['data'] as Array<any>).map(LocationToJSON)),
        'timestamp': value['timestamp'],
    };
}

