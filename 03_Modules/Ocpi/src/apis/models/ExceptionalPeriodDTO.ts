/**
 * 
 * @export
 * @interface ExceptionalPeriodDTO
 */
export interface ExceptionalPeriodDTO {
    /**
     * 
     * @type {string}
     * @memberof ExceptionalPeriodDTO
     */
    periodBegin: string;
    /**
     * 
     * @type {string}
     * @memberof ExceptionalPeriodDTO
     */
    periodEnd: string;
}

/**
 * Check if a given object implements the ExceptionalPeriod interface.
 */
export function instanceOfExceptionalPeriod(value: object): boolean {
    if (!('periodBegin' in value)) return false;
    if (!('periodEnd' in value)) return false;
    return true;
}

export function ExceptionalPeriodFromJSON(json: any): ExceptionalPeriodDTO {
    return ExceptionalPeriodFromJSONTyped(json, false);
}

export function ExceptionalPeriodFromJSONTyped(json: any, ignoreDiscriminator: boolean): ExceptionalPeriodDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'periodBegin': json['period_begin'],
        'periodEnd': json['period_end'],
    };
}

export function ExceptionalPeriodToJSON(value?: ExceptionalPeriodDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'period_begin': value['periodBegin'],
        'period_end': value['periodEnd'],
    };
}

