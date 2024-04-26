
import type { EndpointDTO } from './EndpointDTO';
import {
    EndpointFromJSON,
    EndpointFromJSONTyped,
    EndpointToJSON,
} from './EndpointDTO';
/**
 * 
 * @export
 * @interface VersionDetailDTO
 */
export interface VersionDetailDTO {
    /**
     * 
     * @type {string}
     * @memberof VersionDetailDTO
     */
    version: string;
    /**
     * 
     * @type {Array<EndpointDTO>}
     * @memberof VersionDetailDTO
     */
    endpoints: Array<EndpointDTO>;
}

/**
 * Check if a given object implements the VersionDetail interface.
 */
export function instanceOfVersionDetail(value: object): boolean {
    if (!('version' in value)) return false;
    if (!('endpoints' in value)) return false;
    return true;
}

export function VersionDetailFromJSON(json: any): VersionDetailDTO {
    return VersionDetailFromJSONTyped(json, false);
}

export function VersionDetailFromJSONTyped(json: any, ignoreDiscriminator: boolean): VersionDetailDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'version': json['version'],
        'endpoints': ((json['endpoints'] as Array<any>).map(EndpointFromJSON)),
    };
}

export function VersionDetailToJSON(value?: VersionDetailDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'version': value['version'],
        'endpoints': ((value['endpoints'] as Array<any>).map(EndpointToJSON)),
    };
}

