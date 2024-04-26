
import type { AuthorizationInfoDTO } from './AuthorizationInfoDTO';
import {
    AuthorizationInfoFromJSON,
    AuthorizationInfoFromJSONTyped,
    AuthorizationInfoToJSON,
} from './AuthorizationInfoDTO';
/**
 * 
 * @export
 * @interface OcpiResponseAuthorizationInfoDTO
 */
export interface OcpiResponseAuthorizationInfoDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseAuthorizationInfoDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseAuthorizationInfoDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {AuthorizationInfoDTO}
     * @memberof OcpiResponseAuthorizationInfoDTO
     */
    data?: AuthorizationInfoDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseAuthorizationInfoDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseAuthorizationInfo interface.
 */
export function instanceOfOcpiResponseAuthorizationInfo(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseAuthorizationInfoFromJSON(json: any): OcpiResponseAuthorizationInfoDTO {
    return OcpiResponseAuthorizationInfoFromJSONTyped(json, false);
}

export function OcpiResponseAuthorizationInfoFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseAuthorizationInfoDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : AuthorizationInfoFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseAuthorizationInfoToJSON(value?: OcpiResponseAuthorizationInfoDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': AuthorizationInfoToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

