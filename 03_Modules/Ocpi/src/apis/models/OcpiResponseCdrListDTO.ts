
import type { CdrDTO } from './CdrDTO';
import {
    CDRFromJSON,
    CDRFromJSONTyped,
    CDRToJSON,
} from './CdrDTO';
/**
 * 
 * @export
 * @interface OcpiResponseCdrListDTO
 */
export interface OcpiResponseCdrListDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseCdrListDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseCdrListDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {Array<CdrDTO>}
     * @memberof OcpiResponseCdrListDTO
     */
    data?: Array<CdrDTO>;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseCdrListDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseCDRList interface.
 */
export function instanceOfOcpiResponseCDRList(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseCDRListFromJSON(json: any): OcpiResponseCdrListDTO {
    return OcpiResponseCDRListFromJSONTyped(json, false);
}

export function OcpiResponseCDRListFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseCdrListDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : ((json['data'] as Array<any>).map(CDRFromJSON)),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseCDRListToJSON(value?: OcpiResponseCdrListDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': value['data'] == null ? undefined : ((value['data'] as Array<any>).map(CDRToJSON)),
        'timestamp': value['timestamp'],
    };
}

