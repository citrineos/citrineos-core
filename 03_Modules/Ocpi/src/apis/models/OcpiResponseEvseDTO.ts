
import type { EvseDTO } from './EvseDTO';
import {
    EvseFromJSON,
    EvseFromJSONTyped,
    EvseToJSON,
} from './EvseDTO';
/**
 * 
 * @export
 * @interface OcpiResponseEvseDTO
 */
export interface OcpiResponseEvseDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseEvseDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseEvseDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {EvseDTO}
     * @memberof OcpiResponseEvseDTO
     */
    data?: EvseDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseEvseDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseEvse interface.
 */
export function instanceOfOcpiResponseEvse(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseEvseFromJSON(json: any): OcpiResponseEvseDTO {
    return OcpiResponseEvseFromJSONTyped(json, false);
}

export function OcpiResponseEvseFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseEvseDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : EvseFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseEvseToJSON(value?: OcpiResponseEvseDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': EvseToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

