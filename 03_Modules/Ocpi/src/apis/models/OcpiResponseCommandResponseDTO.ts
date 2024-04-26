
import type { CommandResponseDTO } from './CommandResponseDTO';
import {
    CommandResponseFromJSON,
    CommandResponseFromJSONTyped,
    CommandResponseToJSON,
} from './CommandResponseDTO';
/**
 * 
 * @export
 * @interface OcpiResponseCommandResponseDTO
 */
export interface OcpiResponseCommandResponseDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseCommandResponseDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseCommandResponseDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {CommandResponseDTO}
     * @memberof OcpiResponseCommandResponseDTO
     */
    data?: CommandResponseDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseCommandResponseDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseCommandResponse interface.
 */
export function instanceOfOcpiResponseCommandResponse(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseCommandResponseFromJSON(json: any): OcpiResponseCommandResponseDTO {
    return OcpiResponseCommandResponseFromJSONTyped(json, false);
}

export function OcpiResponseCommandResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseCommandResponseDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : CommandResponseFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseCommandResponseToJSON(value?: OcpiResponseCommandResponseDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': CommandResponseToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

