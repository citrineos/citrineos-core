/**
 * 
 * @export
 * @interface OcpiResponseChargingPreferencesResponseDTO
 */
export interface OcpiResponseChargingPreferencesResponseDTO {
    /**
     * 
     * @type {number}
     * @memberof OcpiResponseChargingPreferencesResponseDTO
     */
    statusCode: number;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseChargingPreferencesResponseDTO
     */
    statusMessage?: string;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseChargingPreferencesResponseDTO
     */
    data?: OcpiResponseChargingPreferencesResponseDataEnum;
    /**
     * 
     * @type {string}
     * @memberof OcpiResponseChargingPreferencesResponseDTO
     */
    timestamp: string;
}


/**
 * @export
 */
export const OcpiResponseChargingPreferencesResponseDataEnum = {
    Accepted: 'ACCEPTED',
    DepartureRequired: 'DEPARTURE_REQUIRED',
    EnergyNeedRequired: 'ENERGY_NEED_REQUIRED',
    NotPossible: 'NOT_POSSIBLE',
    ProfileTypeNotSupported: 'PROFILE_TYPE_NOT_SUPPORTED'
} as const;
export type OcpiResponseChargingPreferencesResponseDataEnum = typeof OcpiResponseChargingPreferencesResponseDataEnum[keyof typeof OcpiResponseChargingPreferencesResponseDataEnum];


/**
 * Check if a given object implements the OcpiResponseChargingPreferencesResponse interface.
 */
export function instanceOfOcpiResponseChargingPreferencesResponse(value: object): boolean {
    if (!('statusCode' in value)) return false;
    if (!('timestamp' in value)) return false;
    return true;
}

export function OcpiResponseChargingPreferencesResponseFromJSON(json: any): OcpiResponseChargingPreferencesResponseDTO {
    return OcpiResponseChargingPreferencesResponseFromJSONTyped(json, false);
}

export function OcpiResponseChargingPreferencesResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): OcpiResponseChargingPreferencesResponseDTO {
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

export function OcpiResponseChargingPreferencesResponseToJSON(value?: OcpiResponseChargingPreferencesResponseDTO | null): any {
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

