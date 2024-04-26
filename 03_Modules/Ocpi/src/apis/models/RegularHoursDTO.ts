/**
 * 
 * @export
 * @interface RegularHoursDTO
 */
export interface RegularHoursDTO {
    /**
     * 
     * @type {number}
     * @memberof RegularHoursDTO
     */
    weekday: number;
    /**
     * 
     * @type {string}
     * @memberof RegularHoursDTO
     */
    periodBegin: string;
    /**
     * 
     * @type {string}
     * @memberof RegularHoursDTO
     */
    periodEnd: string;
}

/**
 * Check if a given object implements the RegularHours interface.
 */
export function instanceOfRegularHours(value: object): boolean {
    if (!('weekday' in value)) return false;
    if (!('periodBegin' in value)) return false;
    if (!('periodEnd' in value)) return false;
    return true;
}

export function RegularHoursFromJSON(json: any): RegularHoursDTO {
    return RegularHoursFromJSONTyped(json, false);
}

export function RegularHoursFromJSONTyped(json: any, ignoreDiscriminator: boolean): RegularHoursDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'weekday': json['weekday'],
        'periodBegin': json['period_begin'],
        'periodEnd': json['period_end'],
    };
}

export function RegularHoursToJSON(value?: RegularHoursDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'weekday': value['weekday'],
        'period_begin': value['periodBegin'],
        'period_end': value['periodEnd'],
    };
}

