/**
 * 
 * @export
 * @interface VersionDTO
 */
export interface VersionDTO {
    /**
     * 
     * @type {string}
     * @memberof VersionDTO
     */
    version: string;
    /**
     * 
     * @type {string}
     * @memberof VersionDTO
     */
    url: string;
}

/**
 * Check if a given object implements the Version interface.
 */
export function instanceOfVersion(value: object): boolean {
    if (!('version' in value)) return false;
    if (!('url' in value)) return false;
    return true;
}

export function VersionFromJSON(json: any): VersionDTO {
    return VersionFromJSONTyped(json, false);
}

export function VersionFromJSONTyped(json: any, ignoreDiscriminator: boolean): VersionDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'version': json['version'],
        'url': json['url'],
    };
}

export function VersionToJSON(value?: VersionDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'version': value['version'],
        'url': value['url'],
    };
}

