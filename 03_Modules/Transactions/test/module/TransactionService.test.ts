import {
  IAuthorizationRepository,
  ITransactionEventRepository,
} from '@citrineos/data';
import {
  AuthorizationStatusEnumType,
  TransactionEventEnumType,
} from '@citrineos/base';
import { TransactionService } from '../../src/module/TransactionService';
import { anIdToken } from '../providers/IdTokenProvider';
import { anAuthorization } from '../providers/AuthorizationProvider';

import { aMessageContext } from '../providers/MessageContextProvider';
import {
  aTransaction,
  aTransactionEventRequest,
} from '../providers/TransactionProvider';
import { IAuthorizer } from '@citrineos/util';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let authorizationRepository: jest.Mocked<IAuthorizationRepository>;
  let transactionEventRepository: jest.Mocked<ITransactionEventRepository>;
  let authorizer: jest.Mocked<IAuthorizer>;

  beforeEach(() => {
    authorizationRepository = {
      readAllByQuerystring: jest.fn(),
    } as unknown as jest.Mocked<IAuthorizationRepository>;

    transactionEventRepository = {
      readAllActiveTransactionsByIdToken: jest.fn(),
    } as unknown as jest.Mocked<ITransactionEventRepository>;

    authorizer = {
      authorize: jest.fn(),
    } as jest.Mocked<IAuthorizer>;

    transactionService = new TransactionService(
      transactionEventRepository,
      authorizationRepository,
      [authorizer],
    );
  });

  it('should return Unknown status when authorizations length is not 1', async () => {
    authorizationRepository.readAllByQuerystring.mockResolvedValue([]);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo!.status).toBe(
      AuthorizationStatusEnumType.Unknown,
    );
  });

  it('should return Accepted status when idTokenInfo is not defined', async () => {
    const authorization = anAuthorization((auth) => {
      auth.idTokenInfo = undefined;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = authorization.idToken;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.Accepted,
    );
  });

  it('should return status from idTokenInfo when not Accepted', async () => {
    const authorization = anAuthorization((auth) => {
      auth.idTokenInfo!.status = AuthorizationStatusEnumType.Blocked;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = authorization.idToken;
      item.eventType = TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.Blocked,
    );
  });

  it('should return Invalid status when cacheExpiryDateTime is expired', async () => {
    const expiredDate = new Date(Date.now() - 1000).toISOString();
    const authorization = anAuthorization((auth) => {
      auth.idTokenInfo!.status = AuthorizationStatusEnumType.Accepted;
      auth.idTokenInfo!.cacheExpiryDateTime = expiredDate;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
      item.eventType = TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.Invalid,
    );
  });

  it('should return ConcurrentTx status when there are concurrent transactions', async () => {
    const authorization = anAuthorization((auth) => {
      auth.idTokenInfo!.status = AuthorizationStatusEnumType.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);
    transactionEventRepository.readAllActiveTransactionsByIdToken.mockResolvedValue(
      [aTransaction(), aTransaction()],
    );

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
      item.eventType = TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.ConcurrentTx,
    );
  });

  it('should apply authorizers when status is Accepted and transaction is started', async () => {
    const authorization = anAuthorization((auth) => {
      auth.idTokenInfo!.status = AuthorizationStatusEnumType.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([
      authorization,
    ]);
    transactionEventRepository.readAllActiveTransactionsByIdToken.mockResolvedValue(
      [],
    );
    authorizer.authorize.mockResolvedValue({});

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
      item.eventType = TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      transactionEventRequest,
      messageContext,
    );

    expect(authorizer.authorize).toHaveBeenCalled();
    expect(response.idTokenInfo?.status).toBe(
      AuthorizationStatusEnumType.Accepted,
    );
  });
});
