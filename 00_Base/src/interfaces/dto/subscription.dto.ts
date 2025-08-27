import { IBaseDto } from '../..';

export interface ISubscriptionDto extends IBaseDto {
  id?: number;
  stationId: string;
  onConnect: boolean;
  onClose: boolean;
  onMessage: boolean;
  sentMessage: boolean;
  messageRegexFilter?: string | null;
  url: string;
}
