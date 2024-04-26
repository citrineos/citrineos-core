
import type { CredentialsDTO } from './CredentialsDTO';
import {
    CredentialsFromJSON,
    CredentialsFromJSONTyped,
    CredentialsToJSON,
} from './CredentialsDTO';
/**
 * 
 * @export
 * @interface OcpiResponseCredentialsDTO
 */
export interface OcpiResponseCredentialsDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseCredentialsDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseCredentialsDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {CredentialsDTO}
     * @memberof OcpiResponseCredentialsDTO
     */
    data?: CredentialsDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseCredentialsDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseCredentialsDTO interface.
 */
export function instanceOfOcpiResponseCredentials(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseCredentialsFromJSON(json: any): OcpiResponseCredentialsDTO {
    return OcpiResponseCredentialsFromJSONTyped(json, false);
}

export function OcpiResponseCredentialsFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseCredentialsDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : CredentialsFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseCredentialsToJSON(value?: OcpiResponseCredentialsDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': CredentialsToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

