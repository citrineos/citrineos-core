
import type { AdditionalGeoLocationDTO } from './AdditionalGeoLocationDTO';
import {
    AdditionalGeoLocationFromJSON,
    AdditionalGeoLocationFromJSONTyped,
    AdditionalGeoLocationToJSON,
} from './AdditionalGeoLocationDTO';
import type { BusinessDetailsDTO } from './BusinessDetailsDTO';
import {
    BusinessDetailsFromJSON,
    BusinessDetailsFromJSONTyped,
    BusinessDetailsToJSON,
} from './BusinessDetailsDTO';
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
import type { EvseDTO } from './EvseDTO';
import {
    EvseFromJSON,
    EvseFromJSONTyped,
    EvseToJSON,
} from './EvseDTO';
import type { GeoLocationDTO } from './GeoLocationDTO';
import {
    GeoLocationFromJSON,
    GeoLocationFromJSONTyped,
    GeoLocationToJSON,
} from './GeoLocationDTO';
import type { HoursDTO } from './HoursDTO';
import {
    HoursFromJSON,
    HoursFromJSONTyped,
    HoursToJSON,
} from './HoursDTO';
import type { ImageDTO } from './ImageDTO';
import {
    ImageFromJSON,
    ImageFromJSONTyped,
    ImageToJSON,
} from './ImageDTO';
import type { PublishTokenTypeDTO } from './PublishTokenTypeDTO';
import {
    PublishTokenTypeFromJSON,
    PublishTokenTypeFromJSONTyped,
    PublishTokenTypeToJSON,
} from './PublishTokenTypeDTO';
/**
 * 
 * @export
 * @interface LocationDTO
 */
export interface LocationDTO {
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    countryCode: string;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    partyId: string;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    id: string;
    /**
     * 
     * @type {boolean}
     * @memberof LocationDTO
     */
    publish: boolean;
    /**
     * 
     * @type {Array<PublishTokenTypeDTO>}
     * @memberof LocationDTO
     */
    publishAllowedTo?: Array<PublishTokenTypeDTO>;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    address: string;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    city: string;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    postalCode?: string;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    state?: string;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    country: string;
    /**
     * 
     * @type {GeoLocationDTO}
     * @memberof LocationDTO
     */
    coordinates: GeoLocationDTO;
    /**
     * 
     * @type {Array<AdditionalGeoLocationDTO>}
     * @memberof LocationDTO
     */
    relatedLocations?: Array<AdditionalGeoLocationDTO>;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    parkingType?: LocationParkingTypeEnum;
    /**
     * 
     * @type {Array<EvseDTO>}
     * @memberof LocationDTO
     */
    evses?: Array<EvseDTO>;
    /**
     * 
     * @type {Array<DisplayTextDTO>}
     * @memberof LocationDTO
     */
    directions?: Array<DisplayTextDTO>;
    /**
     * 
     * @type {BusinessDetailsDTO}
     * @memberof LocationDTO
     */
    operator?: BusinessDetailsDTO;
    /**
     * 
     * @type {BusinessDetailsDTO}
     * @memberof LocationDTO
     */
    suboperator?: BusinessDetailsDTO;
    /**
     * 
     * @type {BusinessDetailsDTO}
     * @memberof LocationDTO
     */
    owner?: BusinessDetailsDTO;
    /**
     * 
     * @type {Array<string>}
     * @memberof LocationDTO
     */
    facilities?: Array<LocationFacilitiesEnum>;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    timeZone?: string;
    /**
     * 
     * @type {HoursDTO}
     * @memberof LocationDTO
     */
    openingTimes?: HoursDTO;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    chargingWhenClosed?: string;
    /**
     * 
     * @type {Array<ImageDTO>}
     * @memberof LocationDTO
     */
    images?: Array<ImageDTO>;
    /**
     * 
     * @type {EnergyMixDTO}
     * @memberof LocationDTO
     */
    energyMix?: EnergyMixDTO;
    /**
     * 
     * @type {string}
     * @memberof LocationDTO
     */
    lastUpdated: string;
}


/**
 * @export
 */
export const LocationParkingTypeEnum = {
    AlongMotorway: 'ALONG_MOTORWAY',
    ParkingGarage: 'PARKING_GARAGE',
    ParkingLot: 'PARKING_LOT',
    OnDriveway: 'ON_DRIVEWAY',
    OnStreet: 'ON_STREET',
    UndergroundGarage: 'UNDERGROUND_GARAGE'
} as const;
export type LocationParkingTypeEnum = typeof LocationParkingTypeEnum[keyof typeof LocationParkingTypeEnum];

/**
 * @export
 */
export const LocationFacilitiesEnum = {
    Hotel: 'HOTEL',
    Restaurant: 'RESTAURANT',
    Cafe: 'CAFE',
    Mall: 'MALL',
    Supermarket: 'SUPERMARKET',
    Sport: 'SPORT',
    RecreationArea: 'RECREATION_AREA',
    Nature: 'NATURE',
    Museum: 'MUSEUM',
    BikeSharing: 'BIKE_SHARING',
    BusStop: 'BUS_STOP',
    TaxiStand: 'TAXI_STAND',
    TramStop: 'TRAM_STOP',
    MetroStation: 'METRO_STATION',
    TrainStation: 'TRAIN_STATION',
    Airport: 'AIRPORT',
    ParkingLot: 'PARKING_LOT',
    CarpoolParking: 'CARPOOL_PARKING',
    FuelStation: 'FUEL_STATION',
    Wifi: 'WIFI'
} as const;
export type LocationFacilitiesEnum = typeof LocationFacilitiesEnum[keyof typeof LocationFacilitiesEnum];


/**
 * Check if a given object implements the Location interface.
 */
export function instanceOfLocation(value: object): boolean {
    if (!('countryCode' in value)) return false;
    if (!('partyId' in value)) return false;
    if (!('id' in value)) return false;
    if (!('publish' in value)) return false;
    if (!('address' in value)) return false;
    if (!('city' in value)) return false;
    if (!('country' in value)) return false;
    if (!('coordinates' in value)) return false;
    if (!('lastUpdated' in value)) return false;
    return true;
}

export function LocationFromJSON(json: any): LocationDTO {
    return LocationFromJSONTyped(json, false);
}

export function LocationFromJSONTyped(json: any, ignoreDiscriminator: boolean): LocationDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'countryCode': json['country_code'],
        'partyId': json['party_id'],
        'id': json['id'],
        'publish': json['publish'],
        'publishAllowedTo': json['publish_allowed_to'] == null ? undefined : ((json['publish_allowed_to'] as Array<any>).map(PublishTokenTypeFromJSON)),
        'name': json['name'] == null ? undefined : json['name'],
        'address': json['address'],
        'city': json['city'],
        'postalCode': json['postal_code'] == null ? undefined : json['postal_code'],
        'state': json['state'] == null ? undefined : json['state'],
        'country': json['country'],
        'coordinates': GeoLocationFromJSON(json['coordinates']),
        'relatedLocations': json['related_locations'] == null ? undefined : ((json['related_locations'] as Array<any>).map(AdditionalGeoLocationFromJSON)),
        'parkingType': json['parking_type'] == null ? undefined : json['parking_type'],
        'evses': json['evses'] == null ? undefined : ((json['evses'] as Array<any>).map(EvseFromJSON)),
        'directions': json['directions'] == null ? undefined : ((json['directions'] as Array<any>).map(DisplayTextFromJSON)),
        'operator': json['operator'] == null ? undefined : BusinessDetailsFromJSON(json['operator']),
        'suboperator': json['suboperator'] == null ? undefined : BusinessDetailsFromJSON(json['suboperator']),
        'owner': json['owner'] == null ? undefined : BusinessDetailsFromJSON(json['owner']),
        'facilities': json['facilities'] == null ? undefined : json['facilities'],
        'timeZone': json['time_zone'] == null ? undefined : json['time_zone'],
        'openingTimes': json['opening_times'] == null ? undefined : HoursFromJSON(json['opening_times']),
        'chargingWhenClosed': json['charging_when_closed'] == null ? undefined : json['charging_when_closed'],
        'images': json['images'] == null ? undefined : ((json['images'] as Array<any>).map(ImageFromJSON)),
        'energyMix': json['energy_mix'] == null ? undefined : EnergyMixFromJSON(json['energy_mix']),
        'lastUpdated': json['last_updated'],
    };
}

export function LocationToJSON(value?: LocationDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'country_code': value['countryCode'],
        'party_id': value['partyId'],
        'id': value['id'],
        'publish': value['publish'],
        'publish_allowed_to': value['publishAllowedTo'] == null ? undefined : ((value['publishAllowedTo'] as Array<any>).map(PublishTokenTypeToJSON)),
        'name': value['name'],
        'address': value['address'],
        'city': value['city'],
        'postal_code': value['postalCode'],
        'state': value['state'],
        'country': value['country'],
        'coordinates': GeoLocationToJSON(value['coordinates']),
        'related_locations': value['relatedLocations'] == null ? undefined : ((value['relatedLocations'] as Array<any>).map(AdditionalGeoLocationToJSON)),
        'parking_type': value['parkingType'],
        'evses': value['evses'] == null ? undefined : ((value['evses'] as Array<any>).map(EvseToJSON)),
        'directions': value['directions'] == null ? undefined : ((value['directions'] as Array<any>).map(DisplayTextToJSON)),
        'operator': BusinessDetailsToJSON(value['operator']),
        'suboperator': BusinessDetailsToJSON(value['suboperator']),
        'owner': BusinessDetailsToJSON(value['owner']),
        'facilities': value['facilities'],
        'time_zone': value['timeZone'],
        'opening_times': HoursToJSON(value['openingTimes']),
        'charging_when_closed': value['chargingWhenClosed'],
        'images': value['images'] == null ? undefined : ((value['images'] as Array<any>).map(ImageToJSON)),
        'energy_mix': EnergyMixToJSON(value['energyMix']),
        'last_updated': value['lastUpdated'],
    };
}

