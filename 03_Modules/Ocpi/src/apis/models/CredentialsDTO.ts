
import type { CredentialsRoleDTO } from './CredentialsRoleDTO';
import {
    CredentialsRoleFromJSON,
    CredentialsRoleFromJSONTyped,
    CredentialsRoleToJSON,
} from './CredentialsRoleDTO';
/**
 * 
 * @export
 * @interface CredentialsDTO
 */
export interface CredentialsDTO {
    /**
     * 
     * @type {string}
     * @memberof CredentialsDTO
     */
    token: string;
    /**
     * 
     * @type {string}
     * @memberof CredentialsDTO
     */
    url: string;
    /**
     * 
     * @type {Array<CredentialsRoleDTO>}
     * @memberof CredentialsDTO
     */
    roles: Array<CredentialsRoleDTO>;
}

/**
 * Check if a given object implements the CredentialsDTO interface.
 */
export function instanceOfCredentials(value: object): boolean {
    if (!('token' in value)) return false;
    if (!('url' in value)) return false;
    if (!('roles' in value)) return false;
    return true;
}

export function CredentialsFromJSON(json: any): CredentialsDTO {
    return CredentialsFromJSONTyped(json, false);
}

export function CredentialsFromJSONTyped(json: any, ignoreDiscriminator: boolean): CredentialsDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'token': json['token'],
        'url': json['url'],
        'roles': ((json['roles'] as Array<any>).map(CredentialsRoleFromJSON)),
    };
}

export function CredentialsToJSON(value?: CredentialsDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'token': value['token'],
        'url': value['url'],
        'roles': ((value['roles'] as Array<any>).map(CredentialsRoleToJSON)),
    };
}

