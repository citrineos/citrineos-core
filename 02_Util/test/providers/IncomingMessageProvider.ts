import { IncomingMessage } from 'http';
import { toBase64 } from 'pvutils';

export function aRequest(override?: Partial<IncomingMessage>): IncomingMessage {
  return {
    ...override,
  } as IncomingMessage;
}

export function aRequestWithAuthorization(
  authorization?: string,
  override?: Partial<IncomingMessage>,
): IncomingMessage {
  return {
    ...aRequest(override),
    headers: {
      authorization: authorization,
    },
  } as IncomingMessage;
}

export function basicAuth(username?: string, password?: string) {
  return `Basic ${toBase64(`${username}:${password}`)}`;
}
