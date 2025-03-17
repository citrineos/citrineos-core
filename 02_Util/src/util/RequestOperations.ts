import { IncomingMessage } from 'http';
import { splitOnce } from './StringOperations';

/**
 * Extracts credentials from the Authorization header.
 *
 * The Authorization header is formatted as follows:
 * AUTHORIZATION: Basic <Base64 encoded(<Configured ChargingStationId>:<Configured BasicAuthPassword>)>
 *
 * @param {http.IncomingMessage} req - The request object.
 * @returns Extracted credentials.
 */
export function extractBasicCredentials(req: IncomingMessage): {
  username?: string;
  password?: string;
} {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Basic ')) {
    return {};
  }

  const base64Credentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString();

  const [username, password] = splitOnce(decodedCredentials, ':');

  return { username, password };
}
