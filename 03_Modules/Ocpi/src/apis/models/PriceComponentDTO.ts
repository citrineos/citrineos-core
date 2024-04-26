/**
 * 
 * @export
 * @interface PriceComponentDTO
 */
export interface PriceComponentDTO {
    /**
     * 
     * @type {string}
     * @memberof PriceComponentDTO
     */
    type: PriceComponentTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof PriceComponentDTO
     */
    price: number;
    /**
     * 
     * @type {number}
     * @memberof PriceComponentDTO
     */
    vat?: number;
    /**
     * 
     * @type {number}
     * @memberof PriceComponentDTO
     */
    stepSize: number;
}


/**
 * @export
 */
export const PriceComponentTypeEnum = {
    Energy: 'ENERGY',
    Flat: 'FLAT',
    ParkingTime: 'PARKING_TIME',
    Time: 'TIME'
} as const;
export type PriceComponentTypeEnum = typeof PriceComponentTypeEnum[keyof typeof PriceComponentTypeEnum];


/**
 * Check if a given object implements the PriceComponent interface.
 */
export function instanceOfPriceComponent(value: object): boolean {
    if (!('type' in value)) return false;
    if (!('price' in value)) return false;
    if (!('stepSize' in value)) return false;
    return true;
}

export function PriceComponentFromJSON(json: any): PriceComponentDTO {
    return PriceComponentFromJSONTyped(json, false);
}

export function PriceComponentFromJSONTyped(json: any, ignoreDiscriminator: boolean): PriceComponentDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'type': json['type'],
        'price': json['price'],
        'vat': json['vat'] == null ? undefined : json['vat'],
        'stepSize': json['step_size'],
    };
}

export function PriceComponentToJSON(value?: PriceComponentDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'type': value['type'],
        'price': value['price'],
        'vat': value['vat'],
        'step_size': value['stepSize'],
    };
}

