import {ArrayMinSize, IsArray, IsNotEmpty, IsOptional, ValidateNested} from 'class-validator';
import {PriceComponent} from './PriceComponent';
import {TariffRestrictions} from './TariffRestrictions';
import {Type} from 'class-transformer';

export class TariffElement {
  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => PriceComponent)
  @ValidateNested({each: true})
  price_components!: PriceComponent[];

  @IsOptional()
  @Type(() => TariffRestrictions)
  @ValidateNested()
  restrictions?: TariffRestrictions | null;
}
