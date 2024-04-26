/**
 * 
 * @export
 * @interface ImageDTO
 */
export interface ImageDTO {
    /**
     * 
     * @type {string}
     * @memberof ImageDTO
     */
    url: string;
    /**
     * 
     * @type {string}
     * @memberof ImageDTO
     */
    thumbnail?: string;
    /**
     * 
     * @type {string}
     * @memberof ImageDTO
     */
    category: ImageCategoryEnum;
    /**
     * 
     * @type {string}
     * @memberof ImageDTO
     */
    type: string;
    /**
     * 
     * @type {number}
     * @memberof ImageDTO
     */
    width?: number;
    /**
     * 
     * @type {number}
     * @memberof ImageDTO
     */
    height?: number;
}


/**
 * @export
 */
export const ImageCategoryEnum = {
    Charger: 'CHARGER',
    Entrance: 'ENTRANCE',
    Location: 'LOCATION',
    Network: 'NETWORK',
    Operator: 'OPERATOR',
    Other: 'OTHER',
    Owner: 'OWNER'
} as const;
export type ImageCategoryEnum = typeof ImageCategoryEnum[keyof typeof ImageCategoryEnum];


/**
 * Check if a given object implements the Image interface.
 */
export function instanceOfImage(value: object): boolean {
    if (!('url' in value)) return false;
    if (!('category' in value)) return false;
    if (!('type' in value)) return false;
    return true;
}

export function ImageFromJSON(json: any): ImageDTO {
    return ImageFromJSONTyped(json, false);
}

export function ImageFromJSONTyped(json: any, ignoreDiscriminator: boolean): ImageDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'url': json['url'],
        'thumbnail': json['thumbnail'] == null ? undefined : json['thumbnail'],
        'category': json['category'],
        'type': json['type'],
        'width': json['width'] == null ? undefined : json['width'],
        'height': json['height'] == null ? undefined : json['height'],
    };
}

export function ImageToJSON(value?: ImageDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'url': value['url'],
        'thumbnail': value['thumbnail'],
        'category': value['category'],
        'type': value['type'],
        'width': value['width'],
        'height': value['height'],
    };
}

