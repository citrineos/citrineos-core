
import type { PriceComponentDTO } from './PriceComponentDTO';
import {
    PriceComponentFromJSON,
    PriceComponentFromJSONTyped,
    PriceComponentToJSON,
} from './PriceComponentDTO';
import type { TariffRestrictionsDTO } from './TariffRestrictionsDTO';
import {
    TariffRestrictionsFromJSON,
    TariffRestrictionsFromJSONTyped,
    TariffRestrictionsToJSON,
} from './TariffRestrictionsDTO';
/**
 * 
 * @export
 * @interface TariffElementDTO
 */
export interface TariffElementDTO {
    /**
     * 
     * @type {Array<PriceComponentDTO>}
     * @memberof TariffElementDTO
     */
    priceComponents: Array<PriceComponentDTO>;
    /**
     * 
     * @type {TariffRestrictionsDTO}
     * @memberof TariffElementDTO
     */
    restrictions?: TariffRestrictionsDTO;
}

/**
 * Check if a given object implements the TariffElement interface.
 */
export function instanceOfTariffElement(value: object): boolean {
    if (!('priceComponents' in value)) return false;
    return true;
}

export function TariffElementFromJSON(json: any): TariffElementDTO {
    return TariffElementFromJSONTyped(json, false);
}

export function TariffElementFromJSONTyped(json: any, ignoreDiscriminator: boolean): TariffElementDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'priceComponents': ((json['price_components'] as Array<any>).map(PriceComponentFromJSON)),
        'restrictions': json['restrictions'] == null ? undefined : TariffRestrictionsFromJSON(json['restrictions']),
    };
}

export function TariffElementToJSON(value?: TariffElementDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'price_components': ((value['priceComponents'] as Array<any>).map(PriceComponentToJSON)),
        'restrictions': TariffRestrictionsToJSON(value['restrictions']),
    };
}

