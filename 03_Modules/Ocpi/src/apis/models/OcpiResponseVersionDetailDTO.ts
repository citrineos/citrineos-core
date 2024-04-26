
import type { VersionDetailDTO } from './VersionDetailDTO';
import {
    VersionDetailFromJSON,
    VersionDetailFromJSONTyped,
    VersionDetailToJSON,
} from './VersionDetailDTO';
/**
 * 
 * @export
 * @interface OcpiResponseVersionDetailDTO
 */
export interface OcpiResponseVersionDetailDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseVersionDetailDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseVersionDetailDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {VersionDetailDTO}
     * @memberof OcpiResponseVersionDetailDTO
     */
    data?: VersionDetailDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseVersionDetailDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseVersionDetail interface.
 */
export function instanceOfOcpiResponseVersionDetail(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseVersionDetailFromJSON(json: any): OcpiResponseVersionDetailDTO {
    return OcpiResponseVersionDetailFromJSONTyped(json, false);
}

export function OcpiResponseVersionDetailFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseVersionDetailDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : VersionDetailFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseVersionDetailToJSON(value?: OcpiResponseVersionDetailDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': VersionDetailToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

