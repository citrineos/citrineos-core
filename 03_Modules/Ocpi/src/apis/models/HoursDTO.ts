
import type { ExceptionalPeriodDTO } from './ExceptionalPeriodDTO';
import {
    ExceptionalPeriodFromJSON,
    ExceptionalPeriodFromJSONTyped,
    ExceptionalPeriodToJSON,
} from './ExceptionalPeriodDTO';
import type { RegularHoursDTO } from './RegularHoursDTO';
import {
    RegularHoursFromJSON,
    RegularHoursFromJSONTyped,
    RegularHoursToJSON,
} from './RegularHoursDTO';
/**
 * 
 * @export
 * @interface HoursDTO
 */
export interface HoursDTO {
    /**
     * 
     * @type {boolean}
     * @memberof HoursDTO
     */
    twentyfourseven: boolean;
    /**
     * 
     * @type {RegularHoursDTO}
     * @memberof HoursDTO
     */
    regularHours?: RegularHoursDTO;
    /**
     * 
     * @type {ExceptionalPeriodDTO}
     * @memberof HoursDTO
     */
    exceptionalOpenings?: ExceptionalPeriodDTO;
    /**
     * 
     * @type {ExceptionalPeriodDTO}
     * @memberof HoursDTO
     */
    exceptionalClosings?: ExceptionalPeriodDTO;
}

/**
 * Check if a given object implements the Hours interface.
 */
export function instanceOfHours(value: object): boolean {
    if (!('twentyfourseven' in value)) return false;
    return true;
}

export function HoursFromJSON(json: any): HoursDTO {
    return HoursFromJSONTyped(json, false);
}

export function HoursFromJSONTyped(json: any, ignoreDiscriminator: boolean): HoursDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'twentyfourseven': json['twentyfourseven'],
        'regularHours': json['regular_hours'] == null ? undefined : RegularHoursFromJSON(json['regular_hours']),
        'exceptionalOpenings': json['exceptional_openings'] == null ? undefined : ExceptionalPeriodFromJSON(json['exceptional_openings']),
        'exceptionalClosings': json['exceptional_closings'] == null ? undefined : ExceptionalPeriodFromJSON(json['exceptional_closings']),
    };
}

export function HoursToJSON(value?: HoursDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'twentyfourseven': value['twentyfourseven'],
        'regular_hours': RegularHoursToJSON(value['regularHours']),
        'exceptional_openings': ExceptionalPeriodToJSON(value['exceptionalOpenings']),
        'exceptional_closings': ExceptionalPeriodToJSON(value['exceptionalClosings']),
    };
}

