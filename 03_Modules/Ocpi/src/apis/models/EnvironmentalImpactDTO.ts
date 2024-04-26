/**
 * 
 * @export
 * @interface EnvironmentalImpactDTO
 */
export interface EnvironmentalImpactDTO {
    /**
     * 
     * @type {string}
     * @memberof EnvironmentalImpactDTO
     */
    category: EnvironmentalImpactCategoryEnum;
    /**
     * 
     * @type {number}
     * @memberof EnvironmentalImpactDTO
     */
    amount: number;
}


/**
 * @export
 */
export const EnvironmentalImpactCategoryEnum = {
    NuclearWaste: 'NUCLEAR_WASTE',
    CarbonDioxide: 'CARBON_DIOXIDE'
} as const;
export type EnvironmentalImpactCategoryEnum = typeof EnvironmentalImpactCategoryEnum[keyof typeof EnvironmentalImpactCategoryEnum];


/**
 * Check if a given object implements the EnvironmentalImpact interface.
 */
export function instanceOfEnvironmentalImpact(value: object): boolean {
    if (!('category' in value)) return false;
    if (!('amount' in value)) return false;
    return true;
}

export function EnvironmentalImpactFromJSON(json: any): EnvironmentalImpactDTO {
    return EnvironmentalImpactFromJSONTyped(json, false);
}

export function EnvironmentalImpactFromJSONTyped(json: any, ignoreDiscriminator: boolean): EnvironmentalImpactDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'category': json['category'],
        'amount': json['amount'],
    };
}

export function EnvironmentalImpactToJSON(value?: EnvironmentalImpactDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'category': value['category'],
        'amount': value['amount'],
    };
}

