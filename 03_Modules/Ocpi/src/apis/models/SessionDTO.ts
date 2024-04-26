
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
/**
 * 
 * @export
 * @interface SessionDTO
 */
export interface SessionDTO {
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    countryCode: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    partyId: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    startDateTime: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    endDateTime?: string;
    /**
     * 
     * @type {number}
     * @memberof SessionDTO
     */
    kwh: number;
    /**
     * 
     * @type {CdrTokenDTO}
     * @memberof SessionDTO
     */
    cdrToken: CdrTokenDTO;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    authMethod: SessionAuthMethodEnum;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    authorizationReference?: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    locationId: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    evseUid: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    connectorId: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    meterId?: string;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    currency: string;
    /**
     * 
     * @type {Array<ChargingPeriodDTO>}
     * @memberof SessionDTO
     */
    chargingPeriods?: Array<ChargingPeriodDTO>;
    /**
     * 
     * @type {PriceDTO}
     * @memberof SessionDTO
     */
    totalCost?: PriceDTO;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    status: SessionStatusEnum;
    /**
     * 
     * @type {string}
     * @memberof SessionDTO
     */
    lastUpdated: string;
}


/**
 * @export
 */
export const SessionAuthMethodEnum = {
    AuthRequest: 'AUTH_REQUEST',
    Command: 'COMMAND',
    Whitelist: 'WHITELIST'
} as const;
export type SessionAuthMethodEnum = typeof SessionAuthMethodEnum[keyof typeof SessionAuthMethodEnum];

/**
 * @export
 */
export const SessionStatusEnum = {
    Active: 'ACTIVE',
    Completed: 'COMPLETED',
    Invalid: 'INVALID',
    Pending: 'PENDING',
    Reservation: 'RESERVATION'
} as const;
export type SessionStatusEnum = typeof SessionStatusEnum[keyof typeof SessionStatusEnum];


/**
 * Check if a given object implements the Session interface.
 */
export function instanceOfSession(value: object): boolean {
    if (!('countryCode' in value)) return false;
    if (!('partyId' in value)) return false;
    if (!('id' in value)) return false;
    if (!('startDateTime' in value)) return false;
    if (!('kwh' in value)) return false;
    if (!('cdrToken' in value)) return false;
    if (!('authMethod' in value)) return false;
    if (!('locationId' in value)) return false;
    if (!('evseUid' in value)) return false;
    if (!('connectorId' in value)) return false;
    if (!('currency' in value)) return false;
    if (!('status' in value)) return false;
    if (!('lastUpdated' in value)) return false;
    return true;
}

export function SessionFromJSON(json: any): SessionDTO {
    return SessionFromJSONTyped(json, false);
}

export function SessionFromJSONTyped(json: any, ignoreDiscriminator: boolean): SessionDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'countryCode': json['country_code'],
        'partyId': json['party_id'],
        'id': json['id'],
        'startDateTime': json['start_date_time'],
        'endDateTime': json['end_date_time'] == null ? undefined : json['end_date_time'],
        'kwh': json['kwh'],
        'cdrToken': CdrTokenFromJSON(json['cdr_token']),
        'authMethod': json['auth_method'],
        'authorizationReference': json['authorization_reference'] == null ? undefined : json['authorization_reference'],
        'locationId': json['location_id'],
        'evseUid': json['evse_uid'],
        'connectorId': json['connector_id'],
        'meterId': json['meter_id'] == null ? undefined : json['meter_id'],
        'currency': json['currency'],
        'chargingPeriods': json['charging_periods'] == null ? undefined : ((json['charging_periods'] as Array<any>).map(ChargingPeriodFromJSON)),
        'totalCost': json['total_cost'] == null ? undefined : PriceFromJSON(json['total_cost']),
        'status': json['status'],
        'lastUpdated': json['last_updated'],
    };
}

export function SessionToJSON(value?: SessionDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'country_code': value['countryCode'],
        'party_id': value['partyId'],
        'id': value['id'],
        'start_date_time': value['startDateTime'],
        'end_date_time': value['endDateTime'],
        'kwh': value['kwh'],
        'cdr_token': CdrTokenToJSON(value['cdrToken']),
        'auth_method': value['authMethod'],
        'authorization_reference': value['authorizationReference'],
        'location_id': value['locationId'],
        'evse_uid': value['evseUid'],
        'connector_id': value['connectorId'],
        'meter_id': value['meterId'],
        'currency': value['currency'],
        'charging_periods': value['chargingPeriods'] == null ? undefined : ((value['chargingPeriods'] as Array<any>).map(ChargingPeriodToJSON)),
        'total_cost': PriceToJSON(value['totalCost']),
        'status': value['status'],
        'last_updated': value['lastUpdated'],
    };
}

