/**
 * 
 * @export
 * @interface ConnectorDTO
 */
export interface ConnectorDTO {
    /**
     * 
     * @type {string}
     * @memberof ConnectorDTO
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof ConnectorDTO
     */
    standard: ConnectorStandardEnum;
    /**
     * 
     * @type {string}
     * @memberof ConnectorDTO
     */
    format: ConnectorFormatEnum;
    /**
     * 
     * @type {string}
     * @memberof ConnectorDTO
     */
    powerType: ConnectorPowerTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof ConnectorDTO
     */
    maxVoltage: number;
    /**
     * 
     * @type {number}
     * @memberof ConnectorDTO
     */
    maxAmperage: number;
    /**
     * 
     * @type {number}
     * @memberof ConnectorDTO
     */
    maxElectricPower?: number;
    /**
     * 
     * @type {Array<string>}
     * @memberof ConnectorDTO
     */
    tariffIds?: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof ConnectorDTO
     */
    termsAndConditions?: string;
    /**
     * 
     * @type {string}
     * @memberof ConnectorDTO
     */
    lastUpdated: string;
}


/**
 * @export
 */
export const ConnectorStandardEnum = {
    Chademo: 'CHADEMO',
    Chaoji: 'CHAOJI',
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
    GbtAc: 'GBT_AC',
    GbtDc: 'GBT_DC',
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
    Nema520: 'NEMA_5_20',
    Nema630: 'NEMA_6_30',
    Nema650: 'NEMA_6_50',
    Nema1030: 'NEMA_10_30',
    Nema1050: 'NEMA_10_50',
    Nema1430: 'NEMA_14_30',
    Nema1450: 'NEMA_14_50',
    PantographBottomUp: 'PANTOGRAPH_BOTTOM_UP',
    PantographTopDown: 'PANTOGRAPH_TOP_DOWN',
    TeslaR: 'TESLA_R',
    TeslaS: 'TESLA_S',
    Unknown: 'UNKNOWN'
} as const;
export type ConnectorStandardEnum = typeof ConnectorStandardEnum[keyof typeof ConnectorStandardEnum];

/**
 * @export
 */
export const ConnectorFormatEnum = {
    Socket: 'SOCKET',
    Cable: 'CABLE'
} as const;
export type ConnectorFormatEnum = typeof ConnectorFormatEnum[keyof typeof ConnectorFormatEnum];

/**
 * @export
 */
export const ConnectorPowerTypeEnum = {
    Ac1Phase: 'AC_1_PHASE',
    Ac3Phase: 'AC_3_PHASE',
    Dc: 'DC'
} as const;
export type ConnectorPowerTypeEnum = typeof ConnectorPowerTypeEnum[keyof typeof ConnectorPowerTypeEnum];


/**
 * Check if a given object implements the ConnectorDTO interface.
 */
export function instanceOfConnector(value: object): boolean {
    if (!('id' in value)) return false;
    if (!('standard' in value)) return false;
    if (!('format' in value)) return false;
    if (!('powerType' in value)) return false;
    if (!('maxVoltage' in value)) return false;
    if (!('maxAmperage' in value)) return false;
    if (!('lastUpdated' in value)) return false;
    return true;
}

export function ConnectorFromJSON(json: any): ConnectorDTO {
    return ConnectorFromJSONTyped(json, false);
}

export function ConnectorFromJSONTyped(json: any, ignoreDiscriminator: boolean): ConnectorDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'standard': json['standard'],
        'format': json['format'],
        'powerType': json['power_type'],
        'maxVoltage': json['max_voltage'],
        'maxAmperage': json['max_amperage'],
        'maxElectricPower': json['max_electric_power'] == null ? undefined : json['max_electric_power'],
        'tariffIds': json['tariff_ids'] == null ? undefined : json['tariff_ids'],
        'termsAndConditions': json['terms_and_conditions'] == null ? undefined : json['terms_and_conditions'],
        'lastUpdated': json['last_updated'],
    };
}

export function ConnectorToJSON(value?: ConnectorDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'id': value['id'],
        'standard': value['standard'],
        'format': value['format'],
        'power_type': value['powerType'],
        'max_voltage': value['maxVoltage'],
        'max_amperage': value['maxAmperage'],
        'max_electric_power': value['maxElectricPower'],
        'tariff_ids': value['tariffIds'],
        'terms_and_conditions': value['termsAndConditions'],
        'last_updated': value['lastUpdated'],
    };
}

