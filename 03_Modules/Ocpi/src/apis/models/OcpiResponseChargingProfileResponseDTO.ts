
import type { ChargingProfileResponseDTO } from './ChargingProfileResponseDTO';
import {
    ChargingProfileResponseFromJSON,
    ChargingProfileResponseFromJSONTyped,
    ChargingProfileResponseToJSON,
} from './ChargingProfileResponseDTO';
/**
 * 
 * @export
 * @interface OcpiResponseChargingProfileResponseDTO
 */
export interface OcpiResponseChargingProfileResponseDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseChargingProfileResponseDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseChargingProfileResponseDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {ChargingProfileResponseDTO}
     * @memberof OcpiResponseChargingProfileResponseDTO
     */
    data?: ChargingProfileResponseDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseChargingProfileResponseDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseChargingProfileResponse interface.
 */
export function instanceOfOcpiResponseChargingProfileResponse(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseChargingProfileResponseFromJSON(json: any): OcpiResponseChargingProfileResponseDTO {
    return OcpiResponseChargingProfileResponseFromJSONTyped(json, false);
}

export function OcpiResponseChargingProfileResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseChargingProfileResponseDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : ChargingProfileResponseFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseChargingProfileResponseToJSON(value?: OcpiResponseChargingProfileResponseDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': ChargingProfileResponseToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

