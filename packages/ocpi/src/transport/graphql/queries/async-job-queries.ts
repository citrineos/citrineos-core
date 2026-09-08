// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
// import { gql } from 'graphql-request';

// export const CREATE_ASYNC_JOB_STATUS_MUTATION = gql`
//   mutation CreateAsyncJobStatus($asyncJobStatus: AsyncJobStatusInput!) {
//     createAsyncJobStatus(asyncJobStatus: $asyncJobStatus) {
//       jobId
//       jobName
//       tenantPartnerId
//       tenantPartner {
//         id
//         name
//       }
//       createdAt
//       finishedAt
//       stoppedAt
//       stopScheduled
//       isFailed
//       paginatedParams
//       totalObjects
//     }
//   }
// `;

// export const UPDATE_ASYNC_JOB_STATUS_MUTATION = gql`
//   mutation UpdateAsyncJobStatus($asyncJobStatus: AsyncJobStatusInput!) {
//     updateAsyncJobStatus(asyncJobStatus: $asyncJobStatus) {
//       jobId
//       jobName
//       tenantPartnerId
//       tenantPartner {
//         id
//         name
//       }
//       createdAt
//       finishedAt
//       stoppedAt
//       stopScheduled
//       isFailed
//       paginatedParams
//       totalObjects
//     }
//   }
// `;

// export const GET_ASYNC_JOB_STATUS_QUERY = gql`
//   query GetAsyncJobStatus($jobId: String!) {
//     asyncJobStatus(jobId: $jobId) {
//       jobId
//       jobName
//       tenantPartnerId
//       tenantPartner {
//         id
//         name
//       }
//       createdAt
//       finishedAt
//       stoppedAt
//       stopScheduled
//       isFailed
//       paginatedParams
//       totalObjects
//     }
//   }
// `;

// export const GET_ASYNC_JOB_STATUSES_QUERY = gql`
//   query GetAsyncJobStatuses($where: AsyncJobStatusWhereInput) {
//     asyncJobStatuses(where: $where) {
//       jobId
//       jobName
//       tenantPartnerId
//       tenantPartner {
//         id
//         name
//       }
//       createdAt
//       finishedAt
//       stoppedAt
//       stopScheduled
//       isFailed
//       paginatedParams
//       totalObjects
//     }
//   }
// `;

// export const DELETE_ASYNC_JOB_STATUS_MUTATION = gql`
//   mutation DeleteAsyncJobStatus($jobId: String!) {
//     deleteAsyncJobStatus(jobId: $jobId)
//   }
// `;
