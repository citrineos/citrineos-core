
import type { TariffDTO } from './TariffDTO';
import {
    TariffFromJSON,
    TariffFromJSONTyped,
    TariffToJSON,
} from './TariffDTO';
/**
 * 
 * @export
 * @interface OcpiResponseTariffListDTO
 */
export interface OcpiResponseTariffListDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseTariffListDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseTariffListDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {Array<TariffDTO>}
     * @memberof OcpiResponseTariffListDTO
     */
    data?: Array<TariffDTO>;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseTariffListDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseTariffList interface.
 */
export function instanceOfOcpiResponseTariffList(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseTariffListFromJSON(json: any): OcpiResponseTariffListDTO {
    return OcpiResponseTariffListFromJSONTyped(json, false);
}

export function OcpiResponseTariffListFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseTariffListDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : ((json['data'] as Array<any>).map(TariffFromJSON)),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseTariffListToJSON(value?: OcpiResponseTariffListDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': value['data'] == null ? undefined : ((value['data'] as Array<any>).map(TariffToJSON)),
        'timestamp': value['timestamp'],
    };
}

