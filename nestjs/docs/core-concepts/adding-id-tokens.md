---
title: Adding ID Tokens
---

# Adding ID Tokens

With any CSMS, a valid `ID Token` must be loaded into the system for charging to be allowed.

## From 1.7.0+

Starting from 1.7.0, a majority of the CRUD operations were removed from the Data API in favor of using the GraphQL
API provided by Hasura. To create an `ID Token` from the Hasura console, navigate to the API Explorer page (if you are running locally,
http://localhost:8090/console/api/api-explorer).

Then enter the following mutation into the query editor to create a minimally-viable `ID Token`:

```
mutation CreateAuthorization {
  insert_Authorizations_one(object: {createdAt: "2025-08-05T10:00:00.000Z", updatedAt: "2025-08-05T10:00:00.000Z", IdTokenInfo: {data: {status: "Accepted", createdAt: "2025-08-05T10:00:00.000Z", updatedAt: "2025-08-05T10:00:00.000Z"}}, IdToken: {data: {idToken: "01", type: "Central", createdAt: "2025-08-05T10:00:00.000Z", updatedAt: "2025-08-05T10:00:00.000Z"}}}) {
    id
    tenantId
    createdAt
    IdToken {
      idToken
      type
    }
    IdTokenInfo {
      status
    }
  }
}
```

## Prior to 1.7.0

To create an `ID Token` on versions of Citrine prior to 1.7.0, you can run the following `cURL` command which will invoke CitrineOS's Data API:

```bash
curl --location --request PUT 'localhost:8080/data/evdriver/authorization?idToken=01&type=Central' \
--header 'Content-Type: application/json' \
--data '{
    "idToken": {
        "idToken": "01",
        "type": "Central"
    },
    "idTokenInfo": {
        "status": "Accepted"
    }
}'
```
