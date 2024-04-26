
import type { SessionDTO } from './SessionDTO';
import {
    SessionFromJSON,
    SessionFromJSONTyped,
    SessionToJSON,
} from './SessionDTO';
/**
 * 
 * @export
 * @interface OcpiResponseSessionDTO
 */
export interface OcpiResponseSessionDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseSessionDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseSessionDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {SessionDTO}
     * @memberof OcpiResponseSessionDTO
     */
    data?: SessionDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseSessionDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseSession interface.
 */
export function instanceOfOcpiResponseSession(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseSessionFromJSON(json: any): OcpiResponseSessionDTO {
    return OcpiResponseSessionFromJSONTyped(json, false);
}

export function OcpiResponseSessionFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseSessionDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : SessionFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseSessionToJSON(value?: OcpiResponseSessionDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': SessionToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

