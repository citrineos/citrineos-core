/**
 * 
 * @export
 * @interface OcpiResponseObjectDTO
 */
export interface OcpiResponseObjectDTO {
    /**
     * 
     * @type {object}
     * @memberof OcpiResponseObjectDTO
     */
    data?: object;
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseObjectDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseObjectDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseObjectDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponseObject interface.
 */
export function instanceOfOcpiResponseObject(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseObjectFromJSON(json: any): OcpiResponseObjectDTO {
    return OcpiResponseObjectFromJSONTyped(json, false);
}

export function OcpiResponseObjectFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseObjectDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'data': json['data'] == null ? undefined : json['data'],
        'statusCode': json['status_code'],
        'statusMessage': json['status_message'] == null ? undefined : json['status_message'],
        'timestamp': json['timestamp'],
    };
}

export function OcpiResponseObjectToJSON(value?: OcpiResponseObjectDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'data': value['data'],
        'status_code': value['statusCode'],
        'status_message': value['statusMessage'],
        'timestamp': value['timestamp'],
    };
}

