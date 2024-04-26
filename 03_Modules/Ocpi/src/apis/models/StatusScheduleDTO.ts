/**
 * 
 * @export
 * @interface StatusScheduleDTO
 */
export interface StatusScheduleDTO {
    /**
     * 
     * @type {string}
     * @memberof StatusScheduleDTO
     */
    periodBegin: string;
    /**
     * 
     * @type {string}
     * @memberof StatusScheduleDTO
     */
    periodEnd?: string;
    /**
     * 
     * @type {string}
     * @memberof StatusScheduleDTO
     */
    status: StatusScheduleStatusEnum;
}


/**
 * @export
 */
export const StatusScheduleStatusEnum = {
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
export type StatusScheduleStatusEnum = typeof StatusScheduleStatusEnum[keyof typeof StatusScheduleStatusEnum];


/**
 * Check if a given object implements the StatusSchedule interface.
 */
export function instanceOfStatusSchedule(value: object): boolean {
    if (!('periodBegin' in value)) return false;
    if (!('status' in value)) return false;
    return true;
}

export function StatusScheduleFromJSON(json: any): StatusScheduleDTO {
    return StatusScheduleFromJSONTyped(json, false);
}

export function StatusScheduleFromJSONTyped(json: any, ignoreDiscriminator: boolean): StatusScheduleDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'periodBegin': json['period_begin'],
        'periodEnd': json['period_end'] == null ? undefined : json['period_end'],
        'status': json['status'],
    };
}

export function StatusScheduleToJSON(value?: StatusScheduleDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'period_begin': value['periodBegin'],
        'period_end': value['periodEnd'],
        'status': value['status'],
    };
}

