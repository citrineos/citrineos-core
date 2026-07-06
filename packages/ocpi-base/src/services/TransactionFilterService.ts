// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// import { ITransactionDatasource } from '../datasources/ITransactionDatasource';
// import { PaginatedResult } from '../model/PaginatedResult';
// import { OcpiGraphqlClient } from '../graphql/OcpiGraphqlClient';
// import { Service, Token } from 'typedi';
// import { Transaction } from '@citrineos/core';
// import { GET_TRANSACTIONS_QUERY } from '../graphql/queries/transaction.queries';
// import { GetTransactionsQuery } from '../graphql/types/graphql';

// export const TRANSACTION_DATASOURCE_SERVICE_TOKEN = new Token(
//   'TRANSACTION_DATASOURCE_SERVICE_TOKEN',
// );

// @Service(TRANSACTION_DATASOURCE_SERVICE_TOKEN)
// export class TransactionFilterService implements ITransactionDatasource {
//   constructor(private readonly ocpiGraphqlClient: OcpiGraphqlClient) {}

//   async getTransactions(
//     cpoCountryCode: string,
//     cpoPartyId: string,
//     mspCountryCode: string,
//     mspPartyId: string,
//     dateFrom?: Date,
//     dateTo?: Date,
//     offset?: number,
//     limit?: number,
//     endedOnly?: boolean,
//   ): Promise<PaginatedResult<Transaction>> {
//     const queryOptions = {
//       cpoCountryCode,
//       cpoPartyId,
//       mspCountryCode,
//       mspPartyId,
//       dateFrom,
//       dateTo,
//       offset,
//       limit,
//     };
//     // Call GraphQL endpoint
//     const response = await this.ocpiGraphqlClient.request<GetTransactionsQuery>(
//       GET_TRANSACTIONS_QUERY,
//       queryOptions,
//     );
//     let transactions = response.Transactions || [];
//     let total = response.Transactions_aggregate?.aggregate?.count || 0;

//     if (endedOnly) {
//       // Filter transactions to include only those that have ended
//       transactions = transactions.filter(
//         (transaction) => transaction.isActive === false,
//       );
//       total = transactions.length;
//     }
//     const result: PaginatedResult<Transaction> =
//       new PaginatedResult<Transaction>();
//     result.data = transactions as unknown as Transaction[];
//     result.total = total;
//     return result;
//   }
// }
