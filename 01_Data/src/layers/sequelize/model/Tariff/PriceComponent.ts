import {tariffDimensionType, TariffDimensionType} from './TariffDimensionType';

export class PriceComponent implements PriceComponentData {

    type: TariffDimensionType;

    price: number;
    vat?: number;

    stepSize: number;

    constructor({type, price, vat, stepSize}: {
        type: TariffDimensionType | string,
        price: number,
        vat?: number,
        stepSize: number
    }) {
        this.type = tariffDimensionType(type);
        this.price = price;
        this.vat = vat;
        this.stepSize = stepSize;
    }

    public is(type: TariffDimensionType): boolean {
        return this.type === type;
    }

    public isEnergy(): boolean {
        return this.is('ENERGY');
    }

}

export type PriceComponentData = {
    type: TariffDimensionType;
    price: number;
    vat?: number;
    stepSize: number;
}