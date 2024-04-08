import "reflect-metadata";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { TransactionEventMapper } from "../../../src/module/mappers/transaction.event.mapper";
import { givenAnyIdTokenInfoType } from "../../providers/id.token.info.type";
import { givenAnyAuthorization } from "../../providers/authorization";
import { givenAnyIdTokenType } from "../../providers/id.token.type";
import {
  AdditionalInfoType,
  IdTokenInfoType,
  IdTokenType,
} from "@citrineos/base";
import { Authorization } from "@citrineos/data";
import { givenAnyAdditionalInfoType } from "../../providers/additional.info.type";

describe("GivenMappingTransactionEvent", () => {
  const MOCK_ADDITIONAL_ID_TOKEN = "additionalIdToken";
  const MOCK_TYPE = "type";

  let transactionEventMapper: TransactionEventMapper;
  let groupdIdToken: IdTokenType;
  let idTokenInfoType: IdTokenInfoType;
  let authorization: Authorization;

  beforeEach(() => {
    groupdIdToken = givenAnyIdTokenType((groupIdTokenType) => {
      groupIdTokenType.additionalInfo = undefined;
    });
    idTokenInfoType = givenAnyIdTokenInfoType((idTokenInfoType) => {
      idTokenInfoType.groupIdToken = groupdIdToken;
    });
    authorization = givenAnyAuthorization((authorization) => {
      authorization.idTokenInfo = idTokenInfoType;
    });

    transactionEventMapper = new TransactionEventMapper();
  });

  test("mapAuthorizationInfo_ReturnsUndefined_IfNoAdditionalInfo", async () => {
    const actual = transactionEventMapper.mapAuthorizationInfo(authorization);
    expect(actual).toBeUndefined();
  });

  test("mapAuthorizationInfo_ReturnsAdditionalInfo_WhenOneIsProvided", async () => {
    const additionalInfo = givenAnyAdditionalInfoType((additionalInfoType) => {
      additionalInfoType.additionalIdToken = MOCK_ADDITIONAL_ID_TOKEN;
      additionalInfoType.type = MOCK_TYPE;
    });
    groupdIdToken.additionalInfo = [additionalInfo];
    const actual = transactionEventMapper.mapAuthorizationInfo(authorization);

    const expected = [
      {
        additionalIdToken: MOCK_ADDITIONAL_ID_TOKEN,
        type: MOCK_TYPE,
      },
    ];

    expect(actual).toEqual(expected);
  });

  test("mapAuthorizationInfo_ReturnsAdditionalInfo_WhenMultipleProvided", async () => {
    groupdIdToken.additionalInfo = Array.from(Array(5)).map((i) => {
      return givenAnyAdditionalInfoType((additionalInfoType) => {
        additionalInfoType.additionalIdToken = MOCK_ADDITIONAL_ID_TOKEN;
        additionalInfoType.type = MOCK_TYPE;
      });
    }) as [AdditionalInfoType, ...AdditionalInfoType[]];

    const actual = transactionEventMapper.mapAuthorizationInfo(authorization);

    const expected = Array.from(Array(5)).map((i) => {
      return {
        additionalIdToken: MOCK_ADDITIONAL_ID_TOKEN,
        type: MOCK_TYPE,
      };
    });

    expect(actual).toEqual(expected);
  });
});
