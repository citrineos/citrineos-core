/**
 * 
 * @export
 * @interface ChargingProfileResponseDTO
 */
export interface ChargingProfileResponseDTO {
    /**
     * 
     * @type {string}
     * @memberof ChargingProfileResponseDTO
     */
    result: ChargingProfileResponseResultEnum;
    /**
     * 
     * @type {number}
     * @memberof ChargingProfileResponseDTO
     */
    timeout: number;
}


/**
 * @export
 */
export const ChargingProfileResponseResultEnum = {
    Accepted: 'ACCEPTED',
    NotSupported: 'NOT_SUPPORTED',
    Rejected: 'REJECTED',
    TooOften: 'TOO_OFTEN',
    UnknownSession: 'UNKNOWN_SESSION'
} as const;
export type ChargingProfileResponseResultEnum = typeof ChargingProfileResponseResultEnum[keyof typeof ChargingProfileResponseResultEnum];


/**
 * Check if a given object implements the ChargingProfileResponse interface.
 */
export function instanceOfChargingProfileResponse(value: object): boolean {
    if (!('result' in value)) return false;
    if (!('timeout' in value)) return false;
    return true;
}

export function ChargingProfileResponseFromJSON(json: any): ChargingProfileResponseDTO {
    return ChargingProfileResponseFromJSONTyped(json, false);
}

export function ChargingProfileResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ChargingProfileResponseDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'result': json['result'],
        'timeout': json['timeout'],
    };
}

export function ChargingProfileResponseToJSON(value?: ChargingProfileResponseDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'result': value['result'],
        'timeout': value['timeout'],
    };
}

