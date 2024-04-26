
import type { DisplayTextDTO } from './DisplayTextDTO';
import {
    DisplayTextFromJSON,
    DisplayTextFromJSONTyped,
    DisplayTextToJSON,
} from './DisplayTextDTO';
/**
 * 
 * @export
 * @interface CommandResponseDTO
 */
export interface CommandResponseDTO {
    /**
     * 
     * @type {string}
     * @memberof CommandResponseDTO
     */
    result: CommandResponseResultEnum;
    /**
     * 
     * @type {number}
     * @memberof CommandResponseDTO
     */
    timeout: number;
    /**
     * 
     * @type {DisplayTextDTO}
     * @memberof CommandResponseDTO
     */
    message?: DisplayTextDTO;
}


/**
 * @export
 */
export const CommandResponseResultEnum = {
    NotSupported: 'NOT_SUPPORTED',
    Rejected: 'REJECTED',
    Accepted: 'ACCEPTED',
    UnknownSession: 'UNKNOWN_SESSION'
} as const;
export type CommandResponseResultEnum = typeof CommandResponseResultEnum[keyof typeof CommandResponseResultEnum];


/**
 * Check if a given object implements the CommandResponse interface.
 */
export function instanceOfCommandResponse(value: object): boolean {
    if (!('result' in value)) return false;
    if (!('timeout' in value)) return false;
    return true;
}

export function CommandResponseFromJSON(json: any): CommandResponseDTO {
    return CommandResponseFromJSONTyped(json, false);
}

export function CommandResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): CommandResponseDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'result': json['result'],
        'timeout': json['timeout'],
        'message': json['message'] == null ? undefined : DisplayTextFromJSON(json['message']),
    };
}

export function CommandResponseToJSON(value?: CommandResponseDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'result': value['result'],
        'timeout': value['timeout'],
        'message': DisplayTextToJSON(value['message']),
    };
}

