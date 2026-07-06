// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { GraphQLClient } from 'graphql-request';
import { Service } from 'typedi';

@Service()
export class OcpiGraphqlClient {
  private client: GraphQLClient;

  constructor(endpoint: string, headers?: Record<string, string>) {
    this.client = new GraphQLClient(endpoint, { headers });
  }

  async request<T, V extends object | undefined>(query: string, variables?: V): Promise<T> {
    return this.client.request<T>(query, variables);
  }
}
