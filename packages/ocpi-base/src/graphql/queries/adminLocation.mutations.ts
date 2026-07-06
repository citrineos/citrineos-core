// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// export const CREATE_OR_UPDATE_LOCATION_MUTATION = gql`
//   mutation CreateOrUpdateLocation($object: Locations_insert_input!) {
//     insert_Locations_one(
//       object: $object
//       on_conflict: {
//         constraint: Locations_pkey
//         update_columns: [
//           name
//           address
//           city
//           postalCode
//           state
//           country
//           coordinates
//           updatedAt
//         ]
//       }
//     ) {
//       id
//       name
//       address
//       city
//       postalCode
//       state
//       country
//       coordinates
//       createdAt
//       updatedAt
//     }
//   }
// `;
