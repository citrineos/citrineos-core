import "reflect-metadata";
import { describe, expect } from "@jest/globals";
import { TransactionEventService } from "../../../src/module/services/transaction.event.service";
import { givenAnyTransactionEventRequest } from "../../providers/transaction.event.request";
import { givenAnyTransactionEventResponse } from "../../providers/transaction.event.response";
import { AuthorizationStatusEnumType } from "@citrineos/base";
import { givenAnyIdTokenType } from "../../providers/id.token.type";
import { givenAnyIdTokenInfoType } from "../../providers/id.token.info.type";
import { TransactionEventRepository } from "@citrineos/data";

describe("GivenHandlingTransactionEvent", () => {
  let transactionEventService: TransactionEventService;
  let transactionEventRepositoryMock: any;

  let readAllActiveTransactionByIdTokenMock = jest.fn();

  test("setConcurrentTransaction_DoesNot_SetStatus_When_NoActiveTransactions", async () => {
    readAllActiveTransactionByIdTokenMock.mockReturnValueOnce(
      new Promise((resolve) => resolve([]))
    );
    setupTransactionEventService();
    const transactionEventRequest = givenAnyTransactionEventRequest();
    const transactionEventResponse = givenAnyTransactionEventResponse(
      (transactionEventResponse) => {
        transactionEventResponse.idTokenInfo = givenAnyIdTokenInfoType(
          (idTokenInfoType) => {
            idTokenInfoType.status = AuthorizationStatusEnumType.Unknown;
          }
        );
      }
    );
    await transactionEventService.setConcurrentTransaction(
      transactionEventRequest,
      transactionEventResponse
    );
    expect(transactionEventResponse.idTokenInfo!.status).toBe(
      AuthorizationStatusEnumType.Unknown
    );
  });

  test("setConcurrentTransaction_SetsStatus_When_ActiveTransactions_Exist", async () => {
    readAllActiveTransactionByIdTokenMock.mockReturnValueOnce(
      new Promise((resolve) =>
        resolve([givenAnyIdTokenType(), givenAnyIdTokenType()])
      )
    );
    setupTransactionEventService();
    const transactionEventRequest = givenAnyTransactionEventRequest();
    const transactionEventResponse = givenAnyTransactionEventResponse(
      (transactionEventResponse) => {
        transactionEventResponse.idTokenInfo = givenAnyIdTokenInfoType();
      }
    );
    await transactionEventService.setConcurrentTransaction(
      transactionEventRequest,
      transactionEventResponse
    );
    expect(transactionEventResponse.idTokenInfo!.status).toBe(
      AuthorizationStatusEnumType.ConcurrentTx
    );
  });

  const setupTransactionEventService = () => {
    transactionEventRepositoryMock = jest.mocked<TransactionEventRepository> = {
      readAllActiveTransactionByIdToken: readAllActiveTransactionByIdTokenMock,
    } as any;
    transactionEventService = new TransactionEventService( // todo is there a better way to inject mocks?
      undefined,
      undefined,
      transactionEventRepositoryMock,
      undefined,
      undefined
    );
  };
});
