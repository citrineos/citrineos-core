/**
 * 
 * @export
 * @interface OcpiResponseUnitDTO
 */
export interface OcpiResponseUnitDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseUnitDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseUnitDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {object}
     * @memberof OcpiResponseUnitDTO
     */
    data?: object;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseUnitDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseUnit interface.
 */
export function instanceOfOcpiResponseUnit(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseUnitFromJSON(json: any): OcpiResponseUnitDTO {
    return OcpiResponseUnitFromJSONTyped(json, false);
}

export function OcpiResponseUnitFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseUnitDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'data': json['data'] == null ? undefined : json['data'],
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseUnitToJSON(value?: OcpiResponseUnitDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'data': value['data'],
        'timestamp': value['timestamp'],
    };
}

