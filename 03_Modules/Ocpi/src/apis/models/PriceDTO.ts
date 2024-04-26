/**
 * 
 * @export
 * @interface PriceDTO
 */
export interface PriceDTO {
    /**
     * 
     * @type {number}
     * @memberof PriceDTO
     */
    exclVat: number;
    /**
     * 
     * @type {number}
     * @memberof PriceDTO
     */
    inclVat: number;
}

/**
 * Check if a given object implements the Price interface.
 */
export function instanceOfPrice(value: object): boolean {
    if (!('exclVat' in value)) return false;
    if (!('inclVat' in value)) return false;
    return true;
}

export function PriceFromJSON(json: any): PriceDTO {
    return PriceFromJSONTyped(json, false);
}

export function PriceFromJSONTyped(json: any, ignoreDiscriminator: boolean): PriceDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'exclVat': json['excl_vat'],
        'inclVat': json['incl_vat'],
    };
}

export function PriceToJSON(value?: PriceDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'excl_vat': value['exclVat'],
        'incl_vat': value['inclVat'],
    };
}

