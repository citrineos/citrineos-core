
import type { GeoLocationDTO } from './GeoLocationDTO';
import {
    GeoLocationFromJSON,
    GeoLocationFromJSONTyped,
    GeoLocationToJSON,
} from './GeoLocationDTO';
/**
 * 
 * @export
 * @interface CdrLocationDTO
 */
export interface CdrLocationDTO {
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    address: string;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    city: string;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    postalCode: string;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    country: string;
    /**
     * 
     * @type {GeoLocationDTO}
     * @memberof CdrLocationDTO
     */
    coordinates: GeoLocationDTO;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    evseUid: string;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    evseId: string;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    connectorId: string;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    connectorStandard: CdrLocationConnectorStandardEnum;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    connectorFormat: CdrLocationConnectorFormatEnum;
    /**
     * 
     * @type {string}
     * @memberof CdrLocationDTO
     */
    connectorPowerType: CdrLocationConnectorPowerTypeEnum;
}


/**
 * @export
 */
export const CdrLocationConnectorStandardEnum = {
    Chademo: 'CHADEMO',
    DomesticA: 'DOMESTIC_A',
    DomesticB: 'DOMESTIC_B',
    DomesticC: 'DOMESTIC_C',
    DomesticD: 'DOMESTIC_D',
    DomesticE: 'DOMESTIC_E',
    DomesticF: 'DOMESTIC_F',
    DomesticG: 'DOMESTIC_G',
    DomesticH: 'DOMESTIC_H',
    DomesticI: 'DOMESTIC_I',
    DomesticJ: 'DOMESTIC_J',
    DomesticK: 'DOMESTIC_K',
    DomesticL: 'DOMESTIC_L',
    Iec603092Single16: 'IEC_60309_2_single_16',
    Iec603092Three16: 'IEC_60309_2_three_16',
    Iec603092Three32: 'IEC_60309_2_three_32',
    Iec603092Three64: 'IEC_60309_2_three_64',
    Iec62196T1: 'IEC_62196_T1',
    Iec62196T1Combo: 'IEC_62196_T1_COMBO',
    Iec62196T2: 'IEC_62196_T2',
    Iec62196T2Combo: 'IEC_62196_T2_COMBO',
    Iec62196T3A: 'IEC_62196_T3A',
    Iec62196T3C: 'IEC_62196_T3C',
    PantographBottomUp: 'PANTOGRAPH_BOTTOM_UP',
    PantographTopDown: 'PANTOGRAPH_TOP_DOWN',
    TeslaR: 'TESLA_R',
    TeslaS: 'TESLA_S'
} as const;
export type CdrLocationConnectorStandardEnum = typeof CdrLocationConnectorStandardEnum[keyof typeof CdrLocationConnectorStandardEnum];

/**
 * @export
 */
export const CdrLocationConnectorFormatEnum = {
    Socket: 'SOCKET',
    Cable: 'CABLE'
} as const;
export type CdrLocationConnectorFormatEnum = typeof CdrLocationConnectorFormatEnum[keyof typeof CdrLocationConnectorFormatEnum];

/**
 * @export
 */
export const CdrLocationConnectorPowerTypeEnum = {
    Ac1Phase: 'AC_1_PHASE',
    Ac3Phase: 'AC_3_PHASE',
    Dc: 'DC'
} as const;
export type CdrLocationConnectorPowerTypeEnum = typeof CdrLocationConnectorPowerTypeEnum[keyof typeof CdrLocationConnectorPowerTypeEnum];


/**
 * Check if a given object implements the CdrLocation interface.
 */
export function instanceOfCdrLocation(value: object): boolean {
    if (!('id' in value)) return false;
    if (!('address' in value)) return false;
    if (!('city' in value)) return false;
    if (!('postalCode' in value)) return false;
    if (!('country' in value)) return false;
    if (!('coordinates' in value)) return false;
    if (!('evseUid' in value)) return false;
    if (!('evseId' in value)) return false;
    if (!('connectorId' in value)) return false;
    if (!('connectorStandard' in value)) return false;
    if (!('connectorFormat' in value)) return false;
    if (!('connectorPowerType' in value)) return false;
    return true;
}

export function CdrLocationFromJSON(json: any): CdrLocationDTO {
    return CdrLocationFromJSONTyped(json, false);
}

export function CdrLocationFromJSONTyped(json: any, ignoreDiscriminator: boolean): CdrLocationDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'name': json['name'] == null ? undefined : json['name'],
        'address': json['address'],
        'city': json['city'],
        'postalCode': json['postal_code'],
        'country': json['country'],
        'coordinates': GeoLocationFromJSON(json['coordinates']),
        'evseUid': json['evse_uid'],
        'evseId': json['evse_id'],
        'connectorId': json['connector_id'],
        'connectorStandard': json['connector_standard'],
        'connectorFormat': json['connector_format'],
        'connectorPowerType': json['connector_power_type'],
    };
}

export function CdrLocationToJSON(value?: CdrLocationDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'id': value['id'],
        'name': value['name'],
        'address': value['address'],
        'city': value['city'],
        'postal_code': value['postalCode'],
        'country': value['country'],
        'coordinates': GeoLocationToJSON(value['coordinates']),
        'evse_uid': value['evseUid'],
        'evse_id': value['evseId'],
        'connector_id': value['connectorId'],
        'connector_standard': value['connectorStandard'],
        'connector_format': value['connectorFormat'],
        'connector_power_type': value['connectorPowerType'],
    };
}

