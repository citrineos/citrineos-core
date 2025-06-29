import {
  CustomDataType,
  MessageContentType,
  MessageFormatEnumType,
  MessagePriorityEnumType,
  MessageStateEnumType,
} from '../../ocpp/model/2.0.1';

export interface IMessageContentTypeDto {
  format: MessageFormatEnumType;
  content: string;
  language?: string | null;
  customData?: CustomDataType | null;
}

export interface IMessageInfoDto {
  databaseId: number;
  id: number;
  stationId: string;
  priority: MessagePriorityEnumType;
  state?: MessageStateEnumType | null;
  startDateTime?: any;
  endDateTime?: any;
  transactionId?: string | null;
  message: MessageContentType;
  active: boolean;
  displayComponentId?: number | null;
}
