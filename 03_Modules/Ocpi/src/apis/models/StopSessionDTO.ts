/**
 * 
 * @export
 * @interface StopSessionDTO
 */
export interface StopSessionDTO {
    /**
     * 
     * @type {string}
     * @memberof StopSessionDTO
     */
    responseUrl: string;
    /**
     * 
     * @type {string}
     * @memberof StopSessionDTO
     */
    sessionId: string;
}

/**
 * Check if a given object implements the StopSession interface.
 */
export function instanceOfStopSession(value: object): boolean {
    if (!('responseUrl' in value)) return false;
    if (!('sessionId' in value)) return false;
    return true;
}

export function StopSessionFromJSON(json: any): StopSessionDTO {
    return StopSessionFromJSONTyped(json, false);
}

export function StopSessionFromJSONTyped(json: any, ignoreDiscriminator: boolean): StopSessionDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'responseUrl': json['response_url'],
        'sessionId': json['session_id'],
    };
}

export function StopSessionToJSON(value?: StopSessionDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'response_url': value['responseUrl'],
        'session_id': value['sessionId'],
    };
}

