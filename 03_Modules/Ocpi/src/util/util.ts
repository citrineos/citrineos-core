import {OcpiResponse} from "@citrineos/base";
import {IsArray, IsOptional, ValidateNested} from "class-validator";
import {Expose, Type} from "class-transformer";

export type Constructor<T = unknown> = new (...args: any[]) => T;

export function OcpiDataResponse<
  TBase extends Constructor<OcpiResponse<any>>,
  TOptions
>(Base: TBase, OptionsClass: Constructor<TOptions>) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  class OcpiDataResponse extends Base {
    @ValidateNested()
    @Type(() => OptionsClass)
    @IsOptional()
    @ValidateNested()
    data?: TOptions;
  }

  return OcpiDataResponse;
}

export function createOcpiResponseList<T, V>(listClass: V, type: T) {
  class OcpiResponseList extends OcpiResponse<V> {
    @IsOptional()
    @Expose()
    @IsArray()
    @ValidateNested({
      each: true,
    })
    @Type(() => type as any)
    public data?: V;
  }

  return OcpiResponseList;
}
