
import type { TokenDTO } from './TokenDTO';
import {
    TokenFromJSON,
    TokenFromJSONTyped,
    TokenToJSON,
} from './TokenDTO';
/**
 * 
 * @export
 * @interface OcpiResponseTokenDTO
 */
export interface OcpiResponseTokenDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseTokenDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseTokenDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {TokenDTO}
     * @memberof OcpiResponseTokenDTO
     */
    data?: TokenDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseTokenDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseToken interface.
 */
export function instanceOfOcpiResponseToken(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseTokenFromJSON(json: any): OcpiResponseTokenDTO {
    return OcpiResponseTokenFromJSONTyped(json, false);
}

export function OcpiResponseTokenFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseTokenDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : TokenFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseTokenToJSON(value?: OcpiResponseTokenDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': TokenToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

