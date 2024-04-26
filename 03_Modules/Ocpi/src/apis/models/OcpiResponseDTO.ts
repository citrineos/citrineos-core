/**
 * 
 * @export
 * @interface OcpiResponseDTO
 */
export interface OcpiResponseDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {object}
     * @memberof OcpiResponseDTO
     */
    data?: object;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseDTO
     */
    timestamp: string;
}

/**
 * Check if a given object implements the OcpiResponse interface.
 */
export function instanceOfOcpiResponse(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseFromJSON(json: any): OcpiResponseDTO {
    return OcpiResponseFromJSONTyped(json, false);
}

export function OcpiResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseDTO {
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

export function OcpiResponseToJSON(value?: OcpiResponseDTO | null): any {
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

