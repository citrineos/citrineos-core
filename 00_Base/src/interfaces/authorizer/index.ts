// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  AuthorizationDto,
  AuthorizationStatusEnumType,
  IMessageContext,
} from '../../index.js';

export interface IAuthorizer {
  /**
   * Interface for adding additional authorization logic.
   * If status is not Accepted, the authorization process will stop and the rejection put into the response.
   * The order of Authorizers can lead to different outputs; instantiate them in the order they should be called.
   *
   * @param {AuthorizationDto} authorization The authorization object associated with the idToken in the request. No modifications should be made to this object.
   * @param {IMessageContext} context
   *
   * @returns {Promise<AuthorizationStatusEnumType>} The updated authorization status
   **/
  authorize(
    authorization: AuthorizationDto,
    context: IMessageContext,
  ): Promise<AuthorizationStatusEnumType>;
}
