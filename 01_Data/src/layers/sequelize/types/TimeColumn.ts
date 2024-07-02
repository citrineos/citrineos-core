import {Column, DataType, Model} from "sequelize-typescript";
import {safelyMap, Time} from "@citrineos/base";

// TODO: replace with custom type
export function TimeColumn() {
    return function (target: any, propertyName: string) {
        Column({
            type: DataType.TIME,
            get(this: Model) {
                return safelyMap(this.getDataValue(propertyName), Time.of);
            },
            set(this: Model, value: Time) {
                this.setDataValue(propertyName, value.hourMinuteSecond);
            }
        })(target, propertyName);
    };
}
