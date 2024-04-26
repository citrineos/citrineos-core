/**
 * 
 * @export
 * @interface TariffRestrictionsDTO
 */
export interface TariffRestrictionsDTO {
    /**
     * 
     * @type {string}
     * @memberof TariffRestrictionsDTO
     */
    startTime?: string;
    /**
     * 
     * @type {string}
     * @memberof TariffRestrictionsDTO
     */
    endTime?: string;
    /**
     * 
     * @type {string}
     * @memberof TariffRestrictionsDTO
     */
    startDate?: string;
    /**
     * 
     * @type {string}
     * @memberof TariffRestrictionsDTO
     */
    endDate?: string;
    /**
     * 
     * @type {number}
     * @memberof TariffRestrictionsDTO
     */
    minKwh?: number;
    /**
     * 
     * @type {number}
     * @memberof TariffRestrictionsDTO
     */
    maxKwh?: number;
    /**
     * 
     * @type {number}
     * @memberof TariffRestrictionsDTO
     */
    minCurrent?: number;
    /**
     * 
     * @type {number}
     * @memberof TariffRestrictionsDTO
     */
    maxCurrent?: number;
    /**
     * 
     * @type {number}
     * @memberof TariffRestrictionsDTO
     */
    minPower?: number;
    /**
     * 
     * @type {number}
     * @memberof TariffRestrictionsDTO
     */
    maxPower?: number;
    /**
     * 
     * @type {number}
     * @memberof TariffRestrictionsDTO
     */
    minDuration?: number;
    /**
     * 
     * @type {number}
     * @memberof TariffRestrictionsDTO
     */
    maxDuration?: number;
    /**
     * 
     * @type {Array<string>}
     * @memberof TariffRestrictionsDTO
     */
    dayOfWeek?: Array<TariffRestrictionsDayOfWeekEnum>;
    /**
     * 
     * @type {string}
     * @memberof TariffRestrictionsDTO
     */
    reservation?: TariffRestrictionsReservationEnum;
}


/**
 * @export
 */
export const TariffRestrictionsDayOfWeekEnum = {
    Monday: 'MONDAY',
    Tuesday: 'TUESDAY',
    Wednesday: 'WEDNESDAY',
    Thursday: 'THURSDAY',
    Friday: 'FRIDAY',
    Saturday: 'SATURDAY',
    Sunday: 'SUNDAY'
} as const;
export type TariffRestrictionsDayOfWeekEnum = typeof TariffRestrictionsDayOfWeekEnum[keyof typeof TariffRestrictionsDayOfWeekEnum];

/**
 * @export
 */
export const TariffRestrictionsReservationEnum = {
    Reservation: 'RESERVATION',
    ReservationExpires: 'RESERVATION_EXPIRES'
} as const;
export type TariffRestrictionsReservationEnum = typeof TariffRestrictionsReservationEnum[keyof typeof TariffRestrictionsReservationEnum];


/**
 * Check if a given object implements the TariffRestrictions interface.
 */
export function instanceOfTariffRestrictions(value: object): boolean {
    return true;
}

export function TariffRestrictionsFromJSON(json: any): TariffRestrictionsDTO {
    return TariffRestrictionsFromJSONTyped(json, false);
}

export function TariffRestrictionsFromJSONTyped(json: any, ignoreDiscriminator: boolean): TariffRestrictionsDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'startTime': json['start_time'] == null ? undefined : json['start_time'],
        'endTime': json['end_time'] == null ? undefined : json['end_time'],
        'startDate': json['start_date'] == null ? undefined : json['start_date'],
        'endDate': json['end_date'] == null ? undefined : json['end_date'],
        'minKwh': json['min_kwh'] == null ? undefined : json['min_kwh'],
        'maxKwh': json['max_kwh'] == null ? undefined : json['max_kwh'],
        'minCurrent': json['min_current'] == null ? undefined : json['min_current'],
        'maxCurrent': json['max_current'] == null ? undefined : json['max_current'],
        'minPower': json['min_power'] == null ? undefined : json['min_power'],
        'maxPower': json['max_power'] == null ? undefined : json['max_power'],
        'minDuration': json['min_duration'] == null ? undefined : json['min_duration'],
        'maxDuration': json['max_duration'] == null ? undefined : json['max_duration'],
        'dayOfWeek': json['day_of_week'] == null ? undefined : json['day_of_week'],
        'reservation': json['reservation'] == null ? undefined : json['reservation'],
    };
}

export function TariffRestrictionsToJSON(value?: TariffRestrictionsDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'start_time': value['startTime'],
        'end_time': value['endTime'],
        'start_date': value['startDate'],
        'end_date': value['endDate'],
        'min_kwh': value['minKwh'],
        'max_kwh': value['maxKwh'],
        'min_current': value['minCurrent'],
        'max_current': value['maxCurrent'],
        'min_power': value['minPower'],
        'max_power': value['maxPower'],
        'min_duration': value['minDuration'],
        'max_duration': value['maxDuration'],
        'day_of_week': value['dayOfWeek'],
        'reservation': value['reservation'],
    };
}

