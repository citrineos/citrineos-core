
import type { VersionDTO } from './VersionDTO';
import {
    VersionFromJSON,
    VersionFromJSONTyped,
    VersionToJSON,
} from './VersionDTO';
/**
 * 
 * @export
 * @interface OcpiResponseListVersionDTO
 */
export interface OcpiResponseListVersionDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseListVersionDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseListVersionDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {Array<VersionDTO>}
     * @memberof OcpiResponseListVersionDTO
     */
    data?: Array<VersionDTO>;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseListVersionDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseListVersion interface.
 */
export function instanceOfOcpiResponseListVersion(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseListVersionFromJSON(json: any): OcpiResponseListVersionDTO {
    return OcpiResponseListVersionFromJSONTyped(json, false);
}

export function OcpiResponseListVersionFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseListVersionDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : ((json['data'] as Array<any>).map(VersionFromJSON)),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseListVersionToJSON(value?: OcpiResponseListVersionDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': value['data'] == null ? undefined : ((value['data'] as Array<any>).map(VersionToJSON)),
        'timestamp': value['timestamp'],
    };
}

