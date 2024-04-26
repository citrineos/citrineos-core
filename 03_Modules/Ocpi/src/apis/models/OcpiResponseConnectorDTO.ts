
import type { ConnectorDTO } from './ConnectorDTO';
import {
    ConnectorFromJSON,
    ConnectorFromJSONTyped,
    ConnectorToJSON,
} from './ConnectorDTO';
/**
 * 
 * @export
 * @interface OcpiResponseConnectorDTO
 */
export interface OcpiResponseConnectorDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseConnectorDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseConnectorDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {ConnectorDTO}
     * @memberof OcpiResponseConnectorDTO
     */
    data?: ConnectorDTO;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseConnectorDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseConnector interface.
 */
export function instanceOfOcpiResponseConnector(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseConnectorFromJSON(json: any): OcpiResponseConnectorDTO {
    return OcpiResponseConnectorFromJSONTyped(json, false);
}

export function OcpiResponseConnectorFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseConnectorDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : ConnectorFromJSON(json['data']),
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseConnectorToJSON(value?: OcpiResponseConnectorDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': ConnectorToJSON(value['data']),
        'timestamp': value['timestamp'],
    };
}

