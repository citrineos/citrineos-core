/**
 * 
 * @export
 * @interface SignedValueDTO
 */
export interface SignedValueDTO {
    /**
     * 
     * @type {string}
     * @memberof SignedValueDTO
     */
    nature: string;
    /**
     * 
     * @type {string}
     * @memberof SignedValueDTO
     */
    plainData: string;
    /**
     * 
     * @type {string}
     * @memberof SignedValueDTO
     */
    signedData: string;
}

/**
 * Check if a given object implements the SignedValue interface.
 */
export function instanceOfSignedValue(value: object): boolean {
    if (!('nature' in value)) return false;
    if (!('plainData' in value)) return false;
    if (!('signedData' in value)) return false;
    return true;
}

export function SignedValueFromJSON(json: any): SignedValueDTO {
    return SignedValueFromJSONTyped(json, false);
}

export function SignedValueFromJSONTyped(json: any, ignoreDiscriminator: boolean): SignedValueDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'nature': json['nature'],
        'plainData': json['plain_data'],
        'signedData': json['signed_data'],
    };
}

export function SignedValueToJSON(value?: SignedValueDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'nature': value['nature'],
        'plain_data': value['plainData'],
        'signed_data': value['signedData'],
    };
}

