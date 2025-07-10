export interface ISubscriptionDto {
  id: number;
  stationId: string;
  onConnect?: boolean;
  onClose?: boolean;
  onMessage?: boolean;
  sentMessage?: boolean;
  messageRegexFilter?: string;
  url: string;
}
