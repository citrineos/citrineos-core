
import type { EnergySourceDTO } from './EnergySourceDTO';
import {
    EnergySourceFromJSON,
    EnergySourceFromJSONTyped,
    EnergySourceToJSON,
} from './EnergySourceDTO';
import type { EnvironmentalImpactDTO } from './EnvironmentalImpactDTO';
import {
    EnvironmentalImpactFromJSON,
    EnvironmentalImpactFromJSONTyped,
    EnvironmentalImpactToJSON,
} from './EnvironmentalImpactDTO';
/**
 * 
 * @export
 * @interface EnergyMixDTO
 */
export interface EnergyMixDTO {
    /**
     * 
     * @type {boolean}
     * @memberof EnergyMixDTO
     */
    isGreenEnergy: boolean;
    /**
     * 
     * @type {Array<EnergySourceDTO>}
     * @memberof EnergyMixDTO
     */
    energySources?: Array<EnergySourceDTO>;
    /**
     * 
     * @type {Array<EnvironmentalImpactDTO>}
     * @memberof EnergyMixDTO
     */
    environImpact?: Array<EnvironmentalImpactDTO>;
    /**
     * 
     * @type {string}
     * @memberof EnergyMixDTO
     */
    supplierName?: string;
    /**
     * 
     * @type {string}
     * @memberof EnergyMixDTO
     */
    energyProductName?: string;
}

/**
 * Check if a given object implements the EnergyMix interface.
 */
export function instanceOfEnergyMix(value: object): boolean {
    if (!('isGreenEnergy' in value)) return false;
    return true;
}

export function EnergyMixFromJSON(json: any): EnergyMixDTO {
    return EnergyMixFromJSONTyped(json, false);
}

export function EnergyMixFromJSONTyped(json: any, ignoreDiscriminator: boolean): EnergyMixDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'isGreenEnergy': json['is_green_energy'],
        'energySources': json['energy_sources'] == null ? undefined : ((json['energy_sources'] as Array<any>).map(EnergySourceFromJSON)),
        'environImpact': json['environ_impact'] == null ? undefined : ((json['environ_impact'] as Array<any>).map(EnvironmentalImpactFromJSON)),
        'supplierName': json['supplier_name'] == null ? undefined : json['supplier_name'],
        'energyProductName': json['energy_product_name'] == null ? undefined : json['energy_product_name'],
    };
}

export function EnergyMixToJSON(value?: EnergyMixDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'is_green_energy': value['isGreenEnergy'],
        'energy_sources': value['energySources'] == null ? undefined : ((value['energySources'] as Array<any>).map(EnergySourceToJSON)),
        'environ_impact': value['environImpact'] == null ? undefined : ((value['environImpact'] as Array<any>).map(EnvironmentalImpactToJSON)),
        'supplier_name': value['supplierName'],
        'energy_product_name': value['energyProductName'],
    };
}

