/**
 * 
 * @export
 * @interface EndpointDTO
 */
export interface EndpointDTO {
    /**
     * 
     * @type {string}
     * @memberof EndpointDTO
     */
    identifier: string;
    /**
     * 
     * @type {string}
     * @memberof EndpointDTO
     */
    role: EndpointRoleEnum;
    /**
     * 
     * @type {string}
     * @memberof EndpointDTO
     */
    url: string;
}


/**
 * @export
 */
export const EndpointRoleEnum = {
    Sender: 'SENDER',
    Receiver: 'RECEIVER'
} as const;
export type EndpointRoleEnum = typeof EndpointRoleEnum[keyof typeof EndpointRoleEnum];


/**
 * Check if a given object implements the Endpoint interface.
 */
export function instanceOfEndpoint(value: object): boolean {
    if (!('identifier' in value)) return false;
    if (!('role' in value)) return false;
    if (!('url' in value)) return false;
    return true;
}

export function EndpointFromJSON(json: any): EndpointDTO {
    return EndpointFromJSONTyped(json, false);
}

export function EndpointFromJSONTyped(json: any, ignoreDiscriminator: boolean): EndpointDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'identifier': json['identifier'],
        'role': json['role'],
        'url': json['url'],
    };
}

export function EndpointToJSON(value?: EndpointDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'identifier': value['identifier'],
        'role': value['role'],
        'url': value['url'],
    };
}

