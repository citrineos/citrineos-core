import {Column, DataType, Model} from "sequelize-typescript";
import {DateOnly, safelyMap} from "@citrineos/base";
import {TariffElement} from "../model/Tariff/TariffElement";

// TODO: custom type would be preferable
export function DateOnlyColumn() {
    return function (target: any, propertyName: string) {
        Column({
            type: DataType.DATEONLY,
            get(this: TariffElement) {
                return safelyMap(this.getDataValue(propertyName), DateOnly.of);
            },
            set(this: Model, value: DateOnly) {
                this.setDataValue(propertyName, value.yearMonthDay);
            }
        })(target, propertyName);
    };
}
