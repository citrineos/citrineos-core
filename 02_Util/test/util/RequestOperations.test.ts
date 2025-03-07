import { extractBasicCredentials } from '../../src/util/RequestOperations';
import { faker } from '@faker-js/faker';
import { aRequestWithAuthorization } from '../providers/IncomingMessageProvider';

describe('extractBasicCredentials', () => {
  it('should return empty object when no Authorization header is present', () => {
    const request = aRequestWithAuthorization();

    expect(extractBasicCredentials(request)).toEqual({});
  });

  it.each([
    ` Basic ${faker.string.alphanumeric()}`,
    `basic ${faker.string.alphanumeric()}`,
    `BASIC ${faker.string.alphanumeric()}`,
    `Bearer ${faker.string.alphanumeric()}`,
    `${faker.string.alphanumeric()}`,
  ])(
    'should return empty object when Authorization header does not start with "Basic "',
    (authorization) => {
      const request = aRequestWithAuthorization(authorization);

      expect(extractBasicCredentials(request)).toEqual({});
    },
  );

  it.each([
    {
      authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=', // username:password
      expected: { username: 'username', password: 'password' },
    },
    {
      authorization: 'Basic Y3AwMDE6U0VQdHdMY2tiNVFENW9uMEVYY0NBbXVRVm1KKmJ1M1pYbUE6Q2x0Mw==', // cp001:SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3
      expected: {
        username: 'cp001',
        password: 'SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
      },
    },
    {
      authorization: 'Basic Y3AwMDE6OjpTRVB0d0xja2I1UUQ1b24wRVhjQ0FtdVFWbUoqYnUzWlhtQTpDbHQz', // cp001:::SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3
      expected: {
        username: 'cp001',
        password: '::SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
      },
    },
    {
      authorization: 'Basic Y3AwMDE6IFNFUHR3TGNrYjVRRDVvbjBFWGNDQW11UVZtSipidTNaWG1BOkNsdDM=', // cp001: SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3
      expected: {
        username: 'cp001',
        password: ' SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
      },
    },
  ])(
    'should return username and password for "Basic" Authorization header',
    ({ authorization, expected }) => {
      const request = aRequestWithAuthorization(authorization);

      expect(extractBasicCredentials(request)).toEqual(expected);
    },
  );

  it.each([
    {
      authorization: 'Basic dXNlcm5hbWU6', // username:
      expected: { username: 'username', password: '' },
    },
    {
      authorization: 'Basic Y3AwMDE6', // cp001:
      expected: { username: 'cp001', password: '' },
    },
  ])(
    'should return empty password if "Basic" Authorization header does not contain password',
    ({ authorization, expected }) => {
      const request = aRequestWithAuthorization(authorization);

      expect(extractBasicCredentials(request)).toEqual(expected);
    },
  );

  it.each([
    {
      authorization: 'Basic dXNlcm5hbWU=', // username
      expected: { username: 'username', password: undefined },
    },
    {
      authorization: 'Basic Y3AwMDE=', // cp001
      expected: { username: 'cp001', password: undefined },
    },
  ])(
    'should return only username when "Basic" Authorization header does not contain colon',
    ({ authorization, expected }) => {
      const request = aRequestWithAuthorization(authorization);

      expect(extractBasicCredentials(request)).toEqual(expected);
    },
  );

  it('should return empty username and password if "Basic" Authorization header contains only colon', () => {
    const request = aRequestWithAuthorization('Basic Og=='); // :

    expect(extractBasicCredentials(request)).toEqual({
      username: '',
      password: '',
    });
  });

  it('should return empty username and no password if "Basic" Authorization header is empty', () => {
    const request = aRequestWithAuthorization('Basic ');

    expect(extractBasicCredentials(request)).toEqual({
      username: '',
      password: undefined,
    });
  });
});
