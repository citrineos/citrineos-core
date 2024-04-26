
import type { SessionDTO } from './SessionDTO';
import {
    SessionFromJSON,
    SessionFromJSONTyped,
    SessionToJSON,
} from './SessionDTO';
/**
 * 
 * @export
 * @interface OcpiResponseSessionListDTO
 */
export interface OcpiResponseSessionListDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseSessionListDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseSessionListDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {Array<SessionDTO>}
     * @memberof OcpiResponseSessionListDTO
     */
    data?: Array<SessionDTO>;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseSessionListDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseSessionList interface.
 */
export function instanceOfOcpiResponseSessionList(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseSessionListFromJSON(json: any): OcpiResponseSessionListDTO {
    return OcpiResponseSessionListFromJSONTyped(json, false);
}

export function OcpiResponseSessionListFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseSessionListDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : ((json['data'] as Array<any>).map(SessionFromJSON)),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseSessionListToJSON(value?: OcpiResponseSessionListDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': value['data'] == null ? undefined : ((value['data'] as Array<any>).map(SessionToJSON)),
        'timestamp': value['timestamp'],
    };
}

