
import type { CdrDTO } from './CdrDTO';
import {
    CDRFromJSON,
    CDRFromJSONTyped,
    CDRToJSON,
} from './CdrDTO';
/**
 * 
 * @export
 * @interface OcpiResponseCdrDTO
 */
export interface OcpiResponseCdrDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseCdrDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseCdrDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {CdrDTO}
     * @memberof OcpiResponseCdrDTO
     */
    data?: CdrDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseCdrDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseCDR interface.
 */
export function instanceOfOcpiResponseCDR(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseCDRFromJSON(json: any): OcpiResponseCdrDTO {
    return OcpiResponseCDRFromJSONTyped(json, false);
}

export function OcpiResponseCDRFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseCdrDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : CDRFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseCDRToJSON(value?: OcpiResponseCdrDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': CDRToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

