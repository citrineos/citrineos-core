
import type { CdrDimensionDTO } from './CdrDimensionDTO';
import {
    CdrDimensionFromJSON,
    CdrDimensionFromJSONTyped,
    CdrDimensionToJSON,
} from './CdrDimensionDTO';
/**
 * 
 * @export
 * @interface ChargingPeriodDTO
 */
export interface ChargingPeriodDTO {
    /**
     * 
     * @type {string}
     * @memberof ChargingPeriodDTO
     */
    startDateTime: string;
    /**
     * 
     * @type {Array<CdrDimensionDTO>}
     * @memberof ChargingPeriodDTO
     */
    dimensions: Array<CdrDimensionDTO>;
    /**
     * 
     * @type {string}
     * @memberof ChargingPeriodDTO
     */
    tariffId?: string;
}

/**
 * Check if a given object implements the ChargingPeriod interface.
 */
export function instanceOfChargingPeriod(value: object): boolean {
    if (!('startDateTime' in value)) return false;
    if (!('dimensions' in value)) return false;
    return true;
}

export function ChargingPeriodFromJSON(json: any): ChargingPeriodDTO {
    return ChargingPeriodFromJSONTyped(json, false);
}

export function ChargingPeriodFromJSONTyped(json: any, ignoreDiscriminator: boolean): ChargingPeriodDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'startDateTime': json['start_date_time'],
        'dimensions': ((json['dimensions'] as Array<any>).map(CdrDimensionFromJSON)),
        'tariffId': json['tariff_id'] == null ? undefined : json['tariff_id'],
    };
}

export function ChargingPeriodToJSON(value?: ChargingPeriodDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'start_date_time': value['startDateTime'],
        'dimensions': ((value['dimensions'] as Array<any>).map(CdrDimensionToJSON)),
        'tariff_id': value['tariffId'],
    };
}

