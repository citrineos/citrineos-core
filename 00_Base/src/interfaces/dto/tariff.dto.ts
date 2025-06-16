import { IBaseDto } from './base.dto';

export interface ITariffDto extends IBaseDto {
  id: number;
  stationId: string;
  currency: Currency;
  pricePerKwh: number;
  pricePerMin?: number;
  pricePerSession?: number;
  authorizationAmount?: number;
  paymentFee?: number;
  taxRate?: number;
}
enum Currency {
  USD = 'USD',
}
