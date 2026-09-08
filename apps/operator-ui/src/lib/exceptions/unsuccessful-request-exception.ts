// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AxiosResponse } from 'axios';

export class UnsuccessfulRequestException extends Error {
  iRestResponse?: AxiosResponse<any>;

  constructor(message: string, iRestResponse?: AxiosResponse<any>) {
    super(message);
    this.name = 'UnsuccessfulRequestException';
    this.iRestResponse = iRestResponse;
  }
}
