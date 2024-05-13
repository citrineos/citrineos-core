import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { PriceComponent } from './PriceComponent';
import { TariffRestrictions } from './TariffRestrictions';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';

export class TariffElement {
  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => PriceComponent)
  @ValidateNested({ each: true })
  price_components!: PriceComponent[];

  @Optional()
  @Type(() => TariffRestrictions)
  @ValidateNested()
  restrictions?: TariffRestrictions | null;
}
