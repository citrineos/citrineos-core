/**
 * 
 * @export
 * @interface CancelReservationDTO
 */
export interface CancelReservationDTO {
    /**
     * 
     * @type {string}
     * @memberof CancelReservationDTO
     */
    responseUrl: string;
    /**
     * 
     * @type {string}
     * @memberof CancelReservationDTO
     */
    reservationId: string;
}

/**
 * Check if a given object implements the CancelReservation interface.
 */
export function instanceOfCancelReservation(value: object): boolean {
    if (!('responseUrl' in value)) return false;
    if (!('reservationId' in value)) return false;
    return true;
}

export function CancelReservationFromJSON(json: any): CancelReservationDTO {
    return CancelReservationFromJSONTyped(json, false);
}

export function CancelReservationFromJSONTyped(json: any, ignoreDiscriminator: boolean): CancelReservationDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'responseUrl': json['response_url'],
        'reservationId': json['reservation_id'],
    };
}

export function CancelReservationToJSON(value?: CancelReservationDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'response_url': value['responseUrl'],
        'reservation_id': value['reservationId'],
    };
}

