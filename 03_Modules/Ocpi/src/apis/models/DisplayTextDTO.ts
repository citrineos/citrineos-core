/**
 * 
 * @export
 * @interface DisplayTextDTO
 */
export interface DisplayTextDTO {
    /**
     * 
     * @type {string}
     * @memberof DisplayTextDTO
     */
    language: string;
    /**
     * 
     * @type {string}
     * @memberof DisplayTextDTO
     */
    text: string;
}

/**
 * Check if a given object implements the DisplayText interface.
 */
export function instanceOfDisplayText(value: object): boolean {
    if (!('language' in value)) return false;
    if (!('text' in value)) return false;
    return true;
}

export function DisplayTextFromJSON(json: any): DisplayTextDTO {
    return DisplayTextFromJSONTyped(json, false);
}

export function DisplayTextFromJSONTyped(json: any, ignoreDiscriminator: boolean): DisplayTextDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'language': json['language'],
        'text': json['text'],
    };
}

export function DisplayTextToJSON(value?: DisplayTextDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'language': value['language'],
        'text': value['text'],
    };
}

