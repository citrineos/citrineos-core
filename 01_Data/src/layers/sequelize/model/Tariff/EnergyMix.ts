import {EnergySources} from './EnergySources';
import {EnvironmentalImpact} from './EnvironmentalImpact';
import {safelyMap, shortName, ShortName} from "@citrineos/base";

export class EnergyMix implements EnergyMixData {

    isGreenEnergy: boolean;

    energySources?: EnergySources[];
    environImpact?: EnvironmentalImpact[];

    supplierName?: ShortName;
    energyProductName?: ShortName;

    public constructor({isGreenEnergy, energySources, environImpact, supplierName, energyProductName}: EnergyMixData) {
        this.isGreenEnergy = isGreenEnergy;
        this.energySources = energySources;
        this.environImpact = environImpact;
        this.supplierName = safelyMap(supplierName, shortName);
        this.energyProductName = safelyMap(energyProductName, shortName);
    }
}

export type EnergyMixData = {
    isGreenEnergy: boolean;

    energySources?: EnergySources[];
    environImpact?: EnvironmentalImpact[];

    supplierName?: ShortName;
    energyProductName?: ShortName;
}
