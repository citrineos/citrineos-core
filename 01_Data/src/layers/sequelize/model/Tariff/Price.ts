export class Price implements PriceData {

    exclVat: number;
    inclVat?: number;

    public constructor(data: PriceData) {
        this.exclVat = data.exclVat;
        this.inclVat = data.inclVat;
    }
}

export type PriceData = {
    exclVat: number;
    inclVat?: number;
}