import { IncomingMessage } from 'http';
import { splitOnce } from './StringOperations';

export function extractBasicCredentials(req: IncomingMessage): {
  username?: string;
  password?: string;
} {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Basic ')) {
    return {};
  }

  const base64Credentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(
    base64Credentials,
    'base64',
  ).toString();

  const [username, password] = splitOnce(decodedCredentials, ':');

  return { username, password };
}
