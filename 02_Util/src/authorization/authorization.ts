// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IAuthorizationDto, IMessageContext } from '@citrineos/base';
import { Authorization } from '@citrineos/data';

export interface IAuthorizer {
  /**
   * Interface for adding additional authorization logic.
   * The Partial IAuthorizationDto is used to update the IdTokenInfo in the AuthorizeResponse or TransactionEventResponse.
   * If IAuthorizationDto.status is not Accepted, the authorization process will stop and the rejection put into the response.
   * The order of Authorizers can lead to different outputs; instantiate them in the order they should be called.
   *
   * @param {Authorization} authorization The authorization object associated with the idToken in the request. No modifications should be made to this object.
   * @param {IMessageContext} context
   *
   * @returns {Promise<Partial<IAuthorizationDto>>} Updates to the IAuthorizationDto
   **/
  authorize(
    authorization: Authorization,
    context: IMessageContext,
  ): Promise<Partial<IAuthorizationDto>>;
}
