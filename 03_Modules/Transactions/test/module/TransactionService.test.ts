import {
  IAuthorizationRepository,
  ITransactionEventRepository,
} from '@citrineos/data';
import { AuthorizationStatusEnumType } from '@citrineos/base';
import { TransactionService } from '../../src/module/TransactionService';
import { aValidIdToken } from '../providers/IdToken';
import { aValidAuthorization } from '../providers/Authorization';
import { Logger } from 'tslog';

import { aValidMessageContext } from '../providers/MessageContext';
import { aValidTransaction } from '../providers/Transaction';
import { IAuthorizer } from '@citrineos/util';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockAuthorizationRepository: jest.Mocked<IAuthorizationRepository>;
  let mockTransactionEventRepository: jest.Mocked<ITransactionEventRepository>;
  let mockLogger: jest.Mocked<Logger<any>>;
  let mockAuthorizer: jest.Mocked<IAuthorizer>;

  beforeEach(() => {
    mockAuthorizationRepository = {
      readAllByQuerystring: jest.fn(),
      // Mock other methods if necessary
    } as any;

    mockTransactionEventRepository = {
      readAllActiveTransactionsByIdToken: jest.fn(),
      // Mock methods if necessary
    } as any;

    mockLogger = {
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger<any>>;

    mockAuthorizer = {
      authorize: jest.fn(),
    } as jest.Mocked<IAuthorizer>;

    transactionService = new TransactionService(
      mockTransactionEventRepository,
      mockAuthorizationRepository,
      mockLogger,
      [mockAuthorizer],
    );
  });

  it('should return Unknown status when authorizations length is not 1', async () => {
    mockAuthorizationRepository.readAllByQuerystring.mockResolvedValue([]);

    const idToken = aValidIdToken();
    const messageContext = aValidMessageContext();
    const response = await transactionService.authorizeIdToken(
      idToken,
      messageContext,
    );

    expect(response.idTokenInfo!.status).toBe(
      AuthorizationStatusEnumType.Unknown,
    );
  });

  it('should return Accepted status when idTokenInfo is not defined', async () => {
    const authorization = aValidAuthorization((auth) => {
      auth.idTokenInfo = undefined;
    });
    mockAuthorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);

    const idToken = aValidIdToken();
    const messageContext = aValidMessageContext();
    const response = await transactionService.authorizeIdToken(
      idToken,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.Accepted,
    );
  });

  it('should return status from idTokenInfo when not Accepted', async () => {
    const authorization = aValidAuthorization((auth) => {
      if (auth.idTokenInfo) {
        auth.idTokenInfo.status = AuthorizationStatusEnumType.Blocked;
      }
    });
    mockAuthorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);

    const idToken = aValidIdToken();
    const messageContext = aValidMessageContext();
    const response = await transactionService.authorizeIdToken(
      idToken,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.Blocked,
    );
  });

  it('should return Invalid status when cacheExpiryDateTime is expired', async () => {
    const expiredDate = new Date(Date.now() - 1000).toISOString();
    const authorization = aValidAuthorization((auth) => {
      if (auth.idTokenInfo) {
        auth.idTokenInfo.status = AuthorizationStatusEnumType.Accepted;
        auth.idTokenInfo.cacheExpiryDateTime = expiredDate;
      }
    });
    mockAuthorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);

    const idToken = aValidIdToken();
    const messageContext = aValidMessageContext();
    const response = await transactionService.authorizeIdToken(
      idToken,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.Invalid,
    );
  });

  it('should return ConcurrentTx status when there are concurrent transactions', async () => {
    const authorization = aValidAuthorization((auth) => {
      if (auth.idTokenInfo) {
        auth.idTokenInfo.status = AuthorizationStatusEnumType.Accepted;
      }
    });
    mockAuthorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);
    mockTransactionEventRepository.readAllActiveTransactionsByIdToken.mockResolvedValue(
      [aValidTransaction(), aValidTransaction()],
    );

    const idToken = aValidIdToken();
    const messageContext = aValidMessageContext();
    const response = await transactionService.authorizeIdToken(
      idToken,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.ConcurrentTx,
    );
  });

  it('should apply authorizers when status is Accepted', async () => {
    const authorization = aValidAuthorization((auth) => {
      if (auth.idTokenInfo) {
        auth.idTokenInfo.status = AuthorizationStatusEnumType.Accepted;
      }
    });
    mockAuthorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);
    mockTransactionEventRepository.readAllActiveTransactionsByIdToken.mockResolvedValue(
      [],
    );
    mockAuthorizer.authorize.mockResolvedValue({});

    const idToken = aValidIdToken();
    const messageContext = aValidMessageContext();
    const response = await transactionService.authorizeIdToken(
      idToken,
      messageContext,
    );

    expect(mockAuthorizer.authorize).toHaveBeenCalled();
    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.Accepted,
    );
  });
});
