// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export interface IAuthenticator {
    authenticate(identifier: string, username?: string, password?: string): Promise<boolean>;
}