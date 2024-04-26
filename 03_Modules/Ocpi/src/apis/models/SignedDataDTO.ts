
import type { SignedValueDTO } from './SignedValueDTO';
import {
    SignedValueFromJSON,
    SignedValueFromJSONTyped,
    SignedValueToJSON,
} from './SignedValueDTO';
/**
 * 
 * @export
 * @interface SignedDataDTO
 */
export interface SignedDataDTO {
    /**
     * 
     * @type {string}
     * @memberof SignedDataDTO
     */
    encodingMethod: string;
    /**
     * 
     * @type {number}
     * @memberof SignedDataDTO
     */
    encodingMethodVersion?: number;
    /**
     * 
     * @type {string}
     * @memberof SignedDataDTO
     */
    publicKey?: string;
    /**
     * 
     * @type {Array<SignedValueDTO>}
     * @memberof SignedDataDTO
     */
    signedValues: Array<SignedValueDTO>;
    /**
     * 
     * @type {string}
     * @memberof SignedDataDTO
     */
    url: string;
}

/**
 * Check if a given object implements the SignedData interface.
 */
export function instanceOfSignedData(value: object): boolean {
    if (!('encodingMethod' in value)) return false;
    if (!('signedValues' in value)) return false;
    if (!('url' in value)) return false;
    return true;
}

export function SignedDataFromJSON(json: any): SignedDataDTO {
    return SignedDataFromJSONTyped(json, false);
}

export function SignedDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): SignedDataDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'encodingMethod': json['encoding_method'],
        'encodingMethodVersion': json['encoding_method_version'] == null ? undefined : json['encoding_method_version'],
        'publicKey': json['public_key'] == null ? undefined : json['public_key'],
        'signedValues': ((json['signed_values'] as Array<any>).map(SignedValueFromJSON)),
        'url': json['url'],
    };
}

export function SignedDataToJSON(value?: SignedDataDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'encoding_method': value['encodingMethod'],
        'encoding_method_version': value['encodingMethodVersion'],
        'public_key': value['publicKey'],
        'signed_values': ((value['signedValues'] as Array<any>).map(SignedValueToJSON)),
        'url': value['url'],
    };
}

