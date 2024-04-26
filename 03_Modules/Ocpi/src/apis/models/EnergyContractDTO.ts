/**
 * 
 * @export
 * @interface EnergyContractDTO
 */
export interface EnergyContractDTO {
    /**
     * 
     * @type {string}
     * @memberof EnergyContractDTO
     */
    supplierName: string;
    /**
     * 
     * @type {string}
     * @memberof EnergyContractDTO
     */
    contractId?: string;
}

/**
 * Check if a given object implements the EnergyContract interface.
 */
export function instanceOfEnergyContract(value: object): boolean {
    if (!('supplierName' in value)) return false;
    return true;
}

export function EnergyContractFromJSON(json: any): EnergyContractDTO {
    return EnergyContractFromJSONTyped(json, false);
}

export function EnergyContractFromJSONTyped(json: any, ignoreDiscriminator: boolean): EnergyContractDTO {
    if (json == null) {
        return json;
    }
    return {
        
        'supplierName': json['supplier_name'],
        'contractId': json['contract_id'] == null ? undefined : json['contract_id'],
    };
}

export function EnergyContractToJSON(value?: EnergyContractDTO | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'supplier_name': value['supplierName'],
        'contract_id': value['contractId'],
    };
}

