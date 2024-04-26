
import type { CdrLocationDTO } from './CdrLocationDTO';
import {
    CdrLocationFromJSON,
    CdrLocationFromJSONTyped,
    CdrLocationToJSON,
} from './CdrLocationDTO';
import type { CdrTokenDTO } from './CdrTokenDTO';
import {
    CdrTokenFromJSON,
    CdrTokenFromJSONTyped,
    CdrTokenToJSON,
} from './CdrTokenDTO';
import type { ChargingPeriodDTO } from './ChargingPeriodDTO';
import {
    ChargingPeriodFromJSON,
    ChargingPeriodFromJSONTyped,
    ChargingPeriodToJSON,
} from './ChargingPeriodDTO';
import type { PriceDTO } from './PriceDTO';
import {
    PriceFromJSON,
    PriceFromJSONTyped,
    PriceToJSON,
} from './PriceDTO';
import type { SignedDataDTO } from './SignedDataDTO';
import {
    SignedDataFromJSON,
    SignedDataFromJSONTyped,
    SignedDataToJSON,
} from './SignedDataDTO';
import type { TariffDTO } from './TariffDTO';
import {
    TariffFromJSON,
    TariffFromJSONTyped,
    TariffToJSON,
} from './TariffDTO';
/**
 * 
 * @export
 * @interface CdrDTO
 */
export interface CdrDTO {
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    countryCode: string;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    partyId: string;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    startDateTime: string;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    endDateTime: string;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    sessionId?: string;
    /**
     * 
     * @type {CdrTokenDTO}
     * @memberof CdrDTO
     */
    cdrToken: CdrTokenDTO;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    authMethod: CDRAuthMethodEnum;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    authorizationReference?: string;
    /**
     * 
     * @type {CdrLocationDTO}
     * @memberof CdrDTO
     */
    cdrLocation: CdrLocationDTO;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    meterId?: string;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    currency: string;
    /**
     * 
     * @type {Array<TariffDTO>}
     * @memberof CdrDTO
     */
    tariffs?: Array<TariffDTO>;
    /**
     * 
     * @type {Array<ChargingPeriodDTO>}
     * @memberof CdrDTO
     */
    chargingPeriods: Array<ChargingPeriodDTO>;
    /**
     * 
     * @type {SignedDataDTO}
     * @memberof CdrDTO
     */
    signedData?: SignedDataDTO;
    /**
     * 
     * @type {PriceDTO}
     * @memberof CdrDTO
     */
    totalCost: PriceDTO;
    /**
     * 
     * @type {PriceDTO}
     * @memberof CdrDTO
     */
    totalFixedCost?: PriceDTO;
    /**
     * 
     * @type {number}
     * @memberof CdrDTO
     */
    totalEnergy: number;
    /**
     * 
     * @type {PriceDTO}
     * @memberof CdrDTO
     */
    totalEnergyCost?: PriceDTO;
    /**
     * 
     * @type {number}
     * @memberof CdrDTO
     */
    totalTime: number;
    /**
     * 
     * @type {PriceDTO}
     * @memberof CdrDTO
     */
    totalTimeCost?: PriceDTO;
    /**
     * 
     * @type {number}
     * @memberof CdrDTO
     */
    totalParkingTime?: number;
    /**
     * 
     * @type {PriceDTO}
     * @memberof CdrDTO
     */
    totalParkingCost?: PriceDTO;
    /**
     * 
     * @type {PriceDTO}
     * @memberof CdrDTO
     */
    totalReservationCost?: PriceDTO;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    remark?: string;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    invoiceReferenceId?: string;
    /**
     * 
     * @type {boolean}
     * @memberof CdrDTO
     */
    credit?: boolean;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    creditReferenceId?: string;
    /**
     * 
     * @type {string}
     * @memberof CdrDTO
     */
    lastUpdated: string;
}


/**
 * @export
 */
export const CDRAuthMethodEnum = {
    AuthRequest: 'AUTH_REQUEST',
    Command: 'COMMAND',
    Whitelist: 'WHITELIST'
} as const;
export type CDRAuthMethodEnum = typeof CDRAuthMethodEnum[keyof typeof CDRAuthMethodEnum];


/**
 * Check if a given object implements the CDR interface.
 */
export function instanceOfCDR(value: object): boolean {
    if (!('countryCode' in value)) return false;
    if (!('partyId' in value)) return false;
    if (!('id' in value)) return false;
    if (!('startDateTime' in value)) return false;
    if (!('endDateTime' in value)) return false;
    if (!('cdrToken' in value)) return false;
    if (!('authMethod' in value)) return false;
    if (!('cdrLocation' in value)) return false;
    if (!('currency' in value)) return false;
    if (!('chargingPeriods' in value)) return false;
    if (!('totalCost' in value)) return false;
    if (!('totalEnergy' in value)) return false;
    if (!('totalTime' in value)) return false;
    if (!('lastUpdated' in value)) return false;
    return true;
}

export function CDRFromJSON(json: any): CdrDTO {
    return CDRFromJSONTyped(json, false);
}

export function CDRFromJSONTyped(json: any, ignoreDiscriminator: boolean): CdrDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'countryCode': json['country_code'],
        'partyId': json['party_id'],
        'id': json['id'],
        'startDateTime': json['start_date_time'],
        'endDateTime': json['end_date_time'],
        'sessionId': json['session_id'] == null ? undefined : json['session_id'],
        'cdrToken': CdrTokenFromJSON(json['cdr_token']),
        'authMethod': json['auth_method'],
        'authorizationReference': json['authorization_reference'] == null ? undefined : json['authorization_reference'],
        'cdrLocation': CdrLocationFromJSON(json['cdr_location']),
        'meterId': json['meter_id'] == null ? undefined : json['meter_id'],
        'currency': json['currency'],
        'tariffs': json['tariffs'] == null ? undefined : ((json['tariffs'] as Array<any>).map(TariffFromJSON)),
        'chargingPeriods': ((json['charging_periods'] as Array<any>).map(ChargingPeriodFromJSON)),
        'signedData': json['signed_data'] == null ? undefined : SignedDataFromJSON(json['signed_data']),
        'totalCost': PriceFromJSON(json['total_cost']),
        'totalFixedCost': json['total_fixed_cost'] == null ? undefined : PriceFromJSON(json['total_fixed_cost']),
        'totalEnergy': json['total_energy'],
        'totalEnergyCost': json['total_energy_cost'] == null ? undefined : PriceFromJSON(json['total_energy_cost']),
        'totalTime': json['total_time'],
        'totalTimeCost': json['total_time_cost'] == null ? undefined : PriceFromJSON(json['total_time_cost']),
        'totalParkingTime': json['total_parking_time'] == null ? undefined : json['total_parking_time'],
        'totalParkingCost': json['total_parking_cost'] == null ? undefined : PriceFromJSON(json['total_parking_cost']),
        'totalReservationCost': json['total_reservation_cost'] == null ? undefined : PriceFromJSON(json['total_reservation_cost']),
        'remark': json['remark'] == null ? undefined : json['remark'],
        'invoiceReferenceId': json['invoice_reference_id'] == null ? undefined : json['invoice_reference_id'],
        'credit': json['credit'] == null ? undefined : json['credit'],
        'creditReferenceId': json['credit_reference_id'] == null ? undefined : json['credit_reference_id'],
        'lastUpdated': json['last_updated'],
    };
}

export function CDRToJSON(value?: CdrDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'country_code': value['countryCode'],
        'party_id': value['partyId'],
        'id': value['id'],
        'start_date_time': value['startDateTime'],
        'end_date_time': value['endDateTime'],
        'session_id': value['sessionId'],
        'cdr_token': CdrTokenToJSON(value['cdrToken']),
        'auth_method': value['authMethod'],
        'authorization_reference': value['authorizationReference'],
        'cdr_location': CdrLocationToJSON(value['cdrLocation']),
        'meter_id': value['meterId'],
        'currency': value['currency'],
        'tariffs': value['tariffs'] == null ? undefined : ((value['tariffs'] as Array<any>).map(TariffToJSON)),
        'charging_periods': ((value['chargingPeriods'] as Array<any>).map(ChargingPeriodToJSON)),
        'signed_data': SignedDataToJSON(value['signedData']),
        'total_cost': PriceToJSON(value['totalCost']),
        'total_fixed_cost': PriceToJSON(value['totalFixedCost']),
        'total_energy': value['totalEnergy'],
        'total_energy_cost': PriceToJSON(value['totalEnergyCost']),
        'total_time': value['totalTime'],
        'total_time_cost': PriceToJSON(value['totalTimeCost']),
        'total_parking_time': value['totalParkingTime'],
        'total_parking_cost': PriceToJSON(value['totalParkingCost']),
        'total_reservation_cost': PriceToJSON(value['totalReservationCost']),
        'remark': value['remark'],
        'invoice_reference_id': value['invoiceReferenceId'],
        'credit': value['credit'],
        'credit_reference_id': value['creditReferenceId'],
        'last_updated': value['lastUpdated'],
    };
}

