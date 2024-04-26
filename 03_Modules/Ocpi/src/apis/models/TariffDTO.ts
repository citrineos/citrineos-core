
import type { DisplayTextDTO } from './DisplayTextDTO';
import {
    DisplayTextFromJSON,
    DisplayTextFromJSONTyped,
    DisplayTextToJSON,
} from './DisplayTextDTO';
import type { EnergyMixDTO } from './EnergyMixDTO';
import {
    EnergyMixFromJSON,
    EnergyMixFromJSONTyped,
    EnergyMixToJSON,
} from './EnergyMixDTO';
import type { PriceDTO } from './PriceDTO';
import {
    PriceFromJSON,
    PriceFromJSONTyped,
    PriceToJSON,
} from './PriceDTO';
import type { TariffElementDTO } from './TariffElementDTO';
import {
    TariffElementFromJSON,
    TariffElementFromJSONTyped,
    TariffElementToJSON,
} from './TariffElementDTO';
/**
 * 
 * @export
 * @interface TariffDTO
 */
export interface TariffDTO {
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    countryCode: string;
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    partyId: string;
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    currency: string;
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    type?: TariffTypeEnum;
    /**
     * 
     * @type {Array<DisplayTextDTO>}
     * @memberof TariffDTO
     */
    tariffAltText?: Array<DisplayTextDTO>;
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    tariffAltUrl?: string;
    /**
     * 
     * @type {PriceDTO}
     * @memberof TariffDTO
     */
    minPrice?: PriceDTO;
    /**
     * 
     * @type {PriceDTO}
     * @memberof TariffDTO
     */
    maxPrice?: PriceDTO;
    /**
     * 
     * @type {Array<TariffElementDTO>}
     * @memberof TariffDTO
     */
    elements: Array<TariffElementDTO>;
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    startDateTime?: string;
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    endDateTime?: string;
    /**
     * 
     * @type {EnergyMixDTO}
     * @memberof TariffDTO
     */
    energyMix?: EnergyMixDTO;
    /**
     * 
     * @type {string}
     * @memberof TariffDTO
     */
    lastUpdated: string;
}


/**
 * @export
 */
export const TariffTypeEnum = {
    AdHocPayment: 'AD_HOC_PAYMENT',
    ProfileCheap: 'PROFILE_CHEAP',
    ProfileFast: 'PROFILE_FAST',
    ProfileGreen: 'PROFILE_GREEN',
    Regular: 'REGULAR'
} as const;
export type TariffTypeEnum = typeof TariffTypeEnum[keyof typeof TariffTypeEnum];


/**
 * Check if a given object implements the Tariff interface.
 */
export function instanceOfTariff(value: object): boolean {
    if (!('countryCode' in value)) return false;
    if (!('partyId' in value)) return false;
    if (!('id' in value)) return false;
    if (!('currency' in value)) return false;
    if (!('elements' in value)) return false;
    if (!('lastUpdated' in value)) return false;
    return true;
}

export function TariffFromJSON(json: any): TariffDTO {
    return TariffFromJSONTyped(json, false);
}

export function TariffFromJSONTyped(json: any, ignoreDiscriminator: boolean): TariffDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'countryCode': json['country_code'],
        'partyId': json['party_id'],
        'id': json['id'],
        'currency': json['currency'],
        'type': json['type'] == null ? undefined : json['type'],
        'tariffAltText': json['tariff_alt_text'] == null ? undefined : ((json['tariff_alt_text'] as Array<any>).map(DisplayTextFromJSON)),
        'tariffAltUrl': json['tariff_alt_url'] == null ? undefined : json['tariff_alt_url'],
        'minPrice': json['min_price'] == null ? undefined : PriceFromJSON(json['min_price']),
        'maxPrice': json['max_price'] == null ? undefined : PriceFromJSON(json['max_price']),
        'elements': ((json['elements'] as Array<any>).map(TariffElementFromJSON)),
        'startDateTime': json['start_date_time'] == null ? undefined : json['start_date_time'],
        'endDateTime': json['end_date_time'] == null ? undefined : json['end_date_time'],
        'energyMix': json['energy_mix'] == null ? undefined : EnergyMixFromJSON(json['energy_mix']),
        'lastUpdated': json['last_updated'],
    };
}

export function TariffToJSON(value?: TariffDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'country_code': value['countryCode'],
        'party_id': value['partyId'],
        'id': value['id'],
        'currency': value['currency'],
        'type': value['type'],
        'tariff_alt_text': value['tariffAltText'] == null ? undefined : ((value['tariffAltText'] as Array<any>).map(DisplayTextToJSON)),
        'tariff_alt_url': value['tariffAltUrl'],
        'min_price': PriceToJSON(value['minPrice']),
        'max_price': PriceToJSON(value['maxPrice']),
        'elements': ((value['elements'] as Array<any>).map(TariffElementToJSON)),
        'start_date_time': value['startDateTime'],
        'end_date_time': value['endDateTime'],
        'energy_mix': EnergyMixToJSON(value['energyMix']),
        'last_updated': value['lastUpdated'],
    };
}

