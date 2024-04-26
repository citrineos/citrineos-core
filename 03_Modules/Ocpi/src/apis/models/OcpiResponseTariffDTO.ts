
import type { TariffDTO } from './TariffDTO';
import {
    TariffFromJSON,
    TariffFromJSONTyped,
    TariffToJSON,
} from './TariffDTO';
/**
 * 
 * @export
 * @interface OcpiResponseTariffDTO
 */
export interface OcpiResponseTariffDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseTariffDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseTariffDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {TariffDTO}
     * @memberof OcpiResponseTariffDTO
     */
    data?: TariffDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseTariffDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseTariff interface.
 */
export function instanceOfOcpiResponseTariff(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseTariffFromJSON(json: any): OcpiResponseTariffDTO {
    return OcpiResponseTariffFromJSONTyped(json, false);
}

export function OcpiResponseTariffFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseTariffDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : TariffFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseTariffToJSON(value?: OcpiResponseTariffDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': TariffToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

