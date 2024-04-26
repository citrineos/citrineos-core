
import type { TokenDTO } from './TokenDTO';
import {
    TokenFromJSON,
    TokenFromJSONTyped,
    TokenToJSON,
} from './TokenDTO';
/**
 * 
 * @export
 * @interface OcpiResponseTokenListDTO
 */
export interface OcpiResponseTokenListDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseTokenListDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseTokenListDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {Array<TokenDTO>}
     * @memberof OcpiResponseTokenListDTO
     */
    data?: Array<TokenDTO>;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseTokenListDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseTokenList interface.
 */
export function instanceOfOcpiResponseTokenList(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseTokenListFromJSON(json: any): OcpiResponseTokenListDTO {
    return OcpiResponseTokenListFromJSONTyped(json, false);
}

export function OcpiResponseTokenListFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseTokenListDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : ((json['data'] as Array<any>).map(TokenFromJSON)),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseTokenListToJSON(value?: OcpiResponseTokenListDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': value['data'] == null ? undefined : ((value['data'] as Array<any>).map(TokenToJSON)),
        'timestamp': value['timestamp'],
    };
}

