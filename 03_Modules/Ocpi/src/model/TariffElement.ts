import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { PriceComponent } from './PriceComponent';
import { TariffRestrictions } from './TariffRestrictions';

export class TariffElement {
  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  price_components!: PriceComponent[];

  @IsOptional()
  restrictions?: TariffRestrictions | null;
}
