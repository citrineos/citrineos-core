
import type { ConnectorDTO } from './ConnectorDTO';
import {
    ConnectorFromJSON,
    ConnectorFromJSONTyped,
    ConnectorToJSON,
} from './ConnectorDTO';
import type { DisplayTextDTO } from './DisplayTextDTO';
import {
    DisplayTextFromJSON,
    DisplayTextFromJSONTyped,
    DisplayTextToJSON,
} from './DisplayTextDTO';
import type { GeoLocationDTO } from './GeoLocationDTO';
import {
    GeoLocationFromJSON,
    GeoLocationFromJSONTyped,
    GeoLocationToJSON,
} from './GeoLocationDTO';
import type { ImageDTO } from './ImageDTO';
import {
    ImageFromJSON,
    ImageFromJSONTyped,
    ImageToJSON,
} from './ImageDTO';
import type { StatusScheduleDTO } from './StatusScheduleDTO';
import {
    StatusScheduleFromJSON,
    StatusScheduleFromJSONTyped,
    StatusScheduleToJSON,
} from './StatusScheduleDTO';
/**
 * 
 * @export
 * @interface EvseDTO
 */
export interface EvseDTO {
    /**
     * Uniquely identifies the EVSE within the CPOs platform (and
     * suboperator platforms).
     * @type {string}
     * @memberof EvseDTO
     */
    uid: string;
    /**
     * 
     * @type {string}
     * @memberof EvseDTO
     */
    evseId?: string;
    /**
     * 
     * @type {string}
     * @memberof EvseDTO
     */
    status: EvseStatusEnum;
    /**
     * 
     * @type {Array<StatusScheduleDTO>}
     * @memberof EvseDTO
     */
    statusSchedule?: Array<StatusScheduleDTO>;
    /**
     * 
     * @type {Array<string>}
     * @memberof EvseDTO
     */
    capabilities?: Array<EvseCapabilitiesEnum>;
    /**
     * 
     * @type {Array<ConnectorDTO>}
     * @memberof EvseDTO
     */
    connectors: Array<ConnectorDTO>;
    /**
     * 
     * @type {string}
     * @memberof EvseDTO
     */
    floorLevel?: string;
    /**
     * 
     * @type {GeoLocationDTO}
     * @memberof EvseDTO
     */
    coordinates?: GeoLocationDTO;
    /**
     * 
     * @type {string}
     * @memberof EvseDTO
     */
    physicalReference?: string;
    /**
     * 
     * @type {Array<DisplayTextDTO>}
     * @memberof EvseDTO
     */
    directions?: Array<DisplayTextDTO>;
    /**
     * 
     * @type {Array<string>}
     * @memberof EvseDTO
     */
    parkingRestrictions?: Array<EvseParkingRestrictionsEnum>;
    /**
     * 
     * @type {Array<ImageDTO>}
     * @memberof EvseDTO
     */
    images?: Array<ImageDTO>;
    /**
     * 
     * @type {string}
     * @memberof EvseDTO
     */
    lastUpdated: string;
}


/**
 * @export
 */
export const EvseStatusEnum = {
    Available: 'AVAILABLE',
    Blocked: 'BLOCKED',
    Charging: 'CHARGING',
    Inoperative: 'INOPERATIVE',
    Outoforder: 'OUTOFORDER',
    Planned: 'PLANNED',
    Removed: 'REMOVED',
    Reserved: 'RESERVED',
    Unknown: 'UNKNOWN'
} as const;
export type EvseStatusEnum = typeof EvseStatusEnum[keyof typeof EvseStatusEnum];

/**
 * @export
 */
export const EvseCapabilitiesEnum = {
    ChargingProfileCapable: 'CHARGING_PROFILE_CAPABLE',
    ChargingPreferencesCapable: 'CHARGING_PREFERENCES_CAPABLE',
    ChipCardSupport: 'CHIP_CARD_SUPPORT',
    ContactlessCardSupport: 'CONTACTLESS_CARD_SUPPORT',
    CreditCardPayable: 'CREDIT_CARD_PAYABLE',
    DebitCardPayable: 'DEBIT_CARD_PAYABLE',
    PedTerminal: 'PED_TERMINAL',
    RemoteStartStopCapable: 'REMOTE_START_STOP_CAPABLE',
    Reservable: 'RESERVABLE',
    RfidReader: 'RFID_READER',
    TokenGroupCapable: 'TOKEN_GROUP_CAPABLE',
    UnlockCapable: 'UNLOCK_CAPABLE'
} as const;
export type EvseCapabilitiesEnum = typeof EvseCapabilitiesEnum[keyof typeof EvseCapabilitiesEnum];

/**
 * @export
 */
export const EvseParkingRestrictionsEnum = {
    EvOnly: 'EV_ONLY',
    Plugged: 'PLUGGED',
    Disabled: 'DISABLED',
    Customers: 'CUSTOMERS',
    Motorcycles: 'MOTORCYCLES'
} as const;
export type EvseParkingRestrictionsEnum = typeof EvseParkingRestrictionsEnum[keyof typeof EvseParkingRestrictionsEnum];


/**
 * Check if a given object implements the Evse interface.
 */
export function instanceOfEvse(value: object): boolean {
    if (!('uid' in value)) return false;
    if (!('status' in value)) return false;
    if (!('connectors' in value)) return false;
    if (!('lastUpdated' in value)) return false;
    return true;
}

export function EvseFromJSON(json: any): EvseDTO {
    return EvseFromJSONTyped(json, false);
}

export function EvseFromJSONTyped(json: any, ignoreDiscriminator: boolean): EvseDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'uid': json['uid'],
        'evseId': json['evse_id'] == null ? undefined : json['evse_id'],
        'status': json['status'],
        'statusSchedule': json['status_schedule'] == null ? undefined : ((json['status_schedule'] as Array<any>).map(StatusScheduleFromJSON)),
        'capabilities': json['capabilities'] == null ? undefined : json['capabilities'],
        'connectors': ((json['connectors'] as Array<any>).map(ConnectorFromJSON)),
        'floorLevel': json['floor_level'] == null ? undefined : json['floor_level'],
        'coordinates': json['coordinates'] == null ? undefined : GeoLocationFromJSON(json['coordinates']),
        'physicalReference': json['physical_reference'] == null ? undefined : json['physical_reference'],
        'directions': json['directions'] == null ? undefined : ((json['directions'] as Array<any>).map(DisplayTextFromJSON)),
        'parkingRestrictions': json['parking_restrictions'] == null ? undefined : json['parking_restrictions'],
        'images': json['images'] == null ? undefined : ((json['images'] as Array<any>).map(ImageFromJSON)),
        'lastUpdated': json['last_updated'],
    };
}

export function EvseToJSON(value?: EvseDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'uid': value['uid'],
        'evse_id': value['evseId'],
        'status': value['status'],
        'status_schedule': value['statusSchedule'] == null ? undefined : ((value['statusSchedule'] as Array<any>).map(StatusScheduleToJSON)),
        'capabilities': value['capabilities'],
        'connectors': ((value['connectors'] as Array<any>).map(ConnectorToJSON)),
        'floor_level': value['floorLevel'],
        'coordinates': GeoLocationToJSON(value['coordinates']),
        'physical_reference': value['physicalReference'],
        'directions': value['directions'] == null ? undefined : ((value['directions'] as Array<any>).map(DisplayTextToJSON)),
        'parking_restrictions': value['parkingRestrictions'],
        'images': value['images'] == null ? undefined : ((value['images'] as Array<any>).map(ImageToJSON)),
        'last_updated': value['lastUpdated'],
    };
}

