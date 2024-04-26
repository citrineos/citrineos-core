
import type { DisplayTextDTO } from './DisplayTextDTO';
import {
    DisplayTextFromJSON,
    DisplayTextFromJSONTyped,
    DisplayTextToJSON,
} from './DisplayTextDTO';
/**
 * 
 * @export
 * @interface CommandResultDTO
 */
export interface CommandResultDTO {
    /**
     * 
     * @type {string}
     * @memberof CommandResultDTO
     */
    result: CommandResultResultEnum;
    /**
     * 
     * @type {DisplayTextDTO}
     * @memberof CommandResultDTO
     */
    message?: DisplayTextDTO;
}


/**
 * @export
 */
export const CommandResultResultEnum = {
    Accepted: 'ACCEPTED',
    CanceledReservation: 'CANCELED_RESERVATION',
    EvseOccupied: 'EVSE_OCCUPIED',
    EvseInoperative: 'EVSE_INOPERATIVE',
    Failed: 'FAILED',
    NotSupported: 'NOT_SUPPORTED',
    Rejected: 'REJECTED',
    Timeout: 'TIMEOUT',
    UnknownReservation: 'UNKNOWN_RESERVATION'
} as const;
export type CommandResultResultEnum = typeof CommandResultResultEnum[keyof typeof CommandResultResultEnum];


/**
 * Check if a given object implements the CommandResultDTO interface.
 */
export function instanceOfCommandResult(value: object): boolean {
    if (!('result' in value)) return false;
    return true;
}

export function CommandResultFromJSON(json: any): CommandResultDTO {
    return CommandResultFromJSONTyped(json, false);
}

export function CommandResultFromJSONTyped(json: any, ignoreDiscriminator: boolean): CommandResultDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'result': json['result'],
        'message': json['message'] == null ? undefined : DisplayTextFromJSON(json['message']),
    };
}

export function CommandResultToJSON(value?: CommandResultDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'result': value['result'],
        'message': DisplayTextToJSON(value['message']),
    };
}

