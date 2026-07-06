// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// import { Service } from 'typedi';
// import { OcpiLogger } from '../util/OcpiLogger';
// import { TokensClientApi } from '../trigger/TokensClientApi';
// import { OcpiResponseStatusCode } from '../model/OcpiResponse';
// import { UnsuccessfulRequestException } from '../exception/UnsuccessfulRequestException';
// import { CredentialsService } from './CredentialsService';
// import { ClientInformation } from '../model/ClientInformation';
// import { OcpiGraphqlClient } from '../graphql/OcpiGraphqlClient';
// import { UPDATE_TOKEN_MUTATION } from '../graphql/queries/token.queries';
// import {
//   CREATE_ASYNC_JOB_STATUS_MUTATION,
//   DELETE_ASYNC_JOB_STATUS_MUTATION,
//   GET_ASYNC_JOB_STATUS_QUERY,
//   GET_ASYNC_JOB_STATUSES_QUERY,
//   UPDATE_ASYNC_JOB_STATUS_MUTATION,
// } from '../graphql/queries/asyncJob.queries';
// import { PaginatedTokenResponse, TokenDTO } from '../model/DTO/TokenDTO';

// // Import AsyncJob types from local definitions
// import {
//   AsyncJobName,
//   AsyncJobRequest,
//   AsyncJobStatusResponse,
// } from '../types/asyncJob.types';
// import { buildPaginatedParams } from '../trigger/param/PaginatedParams';
// import { Authorization } from '@citrineos/core';
// import { TokensMapper } from '../mapper/TokensMapper';

// @Service()
// export class TokensAdminService {
//   constructor(
//     private readonly logger: OcpiLogger,
//     private readonly client: TokensClientApi,
//     private readonly credentialsService: CredentialsService,
//     private readonly ocpiGraphqlClient: OcpiGraphqlClient,
//   ) {}

//   async startFetchTokensByParty(
//     asyncJobRequest: AsyncJobRequest,
//   ): Promise<AsyncJobStatusResponse> {
//     const existingJob = await this.getFetchTokensJobs(
//       asyncJobRequest.tenantPartnerId,
//     );

//     if (existingJob && existingJob.length > 0) {
//       throw new UnsuccessfulRequestException(
//         `Another job for TenantPartner ${asyncJobRequest.tenantPartnerId} is already in progress with ID ${existingJob[0].jobId}`,
//       );
//     }

//     // TODO: Update this to get client credentials by tenantPartnerId
//     // const clientCredentials = await this.credentialsService.getClientInformationByTenantPartnerId(
//     //   asyncJobRequest.tenantPartnerId,
//     // );

//     const asyncJobStatusInput = {
//       jobName: AsyncJobName.FETCH_OCPI_TOKENS,
//       paginatedParams: {
//         limit: asyncJobRequest.paginatedParams?.limit ?? 1000,
//         offset: asyncJobRequest.paginatedParams?.offset ?? 0,
//       },
//       tenantPartnerId: asyncJobRequest.tenantPartnerId,
//       isFailed: false,
//       stopScheduled: false,
//     };

//     const asyncJobStatus: any = await this.ocpiGraphqlClient.request(
//       CREATE_ASYNC_JOB_STATUS_MUTATION,
//       { asyncJobStatus: asyncJobStatusInput },
//     );

//     // TODO: Pass the tenant partner or client credentials when available
//     // this.fetchTokens(asyncJobStatus.createAsyncJobStatus, clientCredentials);

//     return asyncJobStatus.createAsyncJobStatus;
//   }

//   async fetchTokens(
//     asyncJobStatus: AsyncJobStatusResponse,
//     clientCredentials: ClientInformation,
//   ) {
//     try {
//       // const clientToken = clientCredentials[ClientInformationProps.clientToken];
//       // const clientVersions = await clientCredentials.$get(
//       //   ClientInformationProps.clientVersionDetails,
//       // );

//       // this.client.baseUrl = clientVersions[0].url;

//       const params = buildPaginatedParams(
//         asyncJobStatus.paginatedParams.offset,
//         asyncJobStatus.paginatedParams.limit,
//         asyncJobStatus.paginatedParams.dateFrom,
//         asyncJobStatus.paginatedParams.dateTo,
//       );
//       // params.authorization = clientToken;
//       // params.version = clientVersions[0].version;

//       let finished = false;

//       do {
//         const response: PaginatedTokenResponse = await this.client.getTokens(
//           asyncJobStatus.tenantPartner!.tenant!.countryCode!,
//           asyncJobStatus.tenantPartner!.tenant!.partyId!,
//           asyncJobStatus.tenantPartner!.countryCode!,
//           asyncJobStatus.tenantPartner!.partyId!,
//           asyncJobStatus.tenantPartner!.partnerProfileOCPI!,
//           params,
//         );
//         if (
//           response.status_code === OcpiResponseStatusCode.GenericSuccessCode
//         ) {
//           await this.updateTokens([response?.data as any]);

//           const updateResult: any = await this.ocpiGraphqlClient.request(
//             UPDATE_ASYNC_JOB_STATUS_MUTATION,
//             {
//               asyncJobStatus: {
//                 jobId: asyncJobStatus.jobId,
//                 paginatedParams: {
//                   ...asyncJobStatus.paginatedParams,
//                   offset: params.offset,
//                 },
//               },
//             },
//           );

//           asyncJobStatus = updateResult.updateAsyncJobStatus;

//           if (asyncJobStatus.stopScheduled) {
//             finished = true;
//             break;
//           }

//           params.offset = response.offset;
//           params.limit = response.limit;

//           finished = !response.link;
//         } else {
//           this.logger.error(
//             'Received non-successful response from Tokens fetch for job ' +
//               asyncJobStatus.jobId,
//             response,
//           );
//           asyncJobStatus.isFailed = true;
//           break;
//         }
//       } while (!finished);
//     } catch (e) {
//       this.logger.error(
//         'Failed to fetch tokens for job ' + asyncJobStatus.jobId,
//         e,
//       );
//       asyncJobStatus.isFailed = true;
//     }

//     if (asyncJobStatus.stopScheduled) {
//       await this.ocpiGraphqlClient.request(UPDATE_ASYNC_JOB_STATUS_MUTATION, {
//         asyncJobStatus: {
//           jobId: asyncJobStatus.jobId,
//           stoppedAt: new Date(),
//           isFailed: asyncJobStatus.isFailed,
//         },
//       });
//     } else {
//       await this.ocpiGraphqlClient.request(UPDATE_ASYNC_JOB_STATUS_MUTATION, {
//         asyncJobStatus: {
//           jobId: asyncJobStatus.jobId,
//           finishedAt: new Date(),
//           isFailed: asyncJobStatus.isFailed,
//         },
//       });
//     }
//   }

//   async stopFetchTokens(jobId: string): Promise<AsyncJobStatusResponse> {
//     const existingJob = await this.getFetchTokensJob(jobId);

//     if (!existingJob) {
//       throw new UnsuccessfulRequestException(
//         `No job found for job ID: ${jobId}`,
//       );
//     }

//     const result: any = await this.ocpiGraphqlClient.request(
//       UPDATE_ASYNC_JOB_STATUS_MUTATION,
//       {
//         asyncJobStatus: {
//           jobId: jobId,
//           stopScheduled: true,
//         },
//       },
//     );

//     return result.updateAsyncJobStatus;
//   }

//   async resumeFetchTokens(jobId: string): Promise<AsyncJobStatusResponse> {
//     const existingJob = await this.getFetchTokensJob(jobId);

//     if (!existingJob) {
//       throw new UnsuccessfulRequestException(
//         `No job found for job ID: ${jobId}`,
//       );
//     }

//     if (!existingJob.stopScheduled) {
//       throw new UnsuccessfulRequestException(
//         `Job ${jobId} is not stopped. Cannot resume.`,
//       );
//     }

//     // TODO: Update this to get client credentials by tenantPartnerId
//     // const clientCredentials = await this.credentialsService.getClientInformationByTenantPartnerId(
//     //   existingJob.tenantPartnerId,
//     // );

//     const result: any = await this.ocpiGraphqlClient.request(
//       UPDATE_ASYNC_JOB_STATUS_MUTATION,
//       {
//         asyncJobStatus: {
//           jobId: jobId,
//           stopScheduled: false,
//         },
//       },
//     );

//     // TODO: Pass the tenant partner or client credentials when available
//     // this.fetchTokens(result.updateAsyncJobStatus, clientCredentials);

//     return result.updateAsyncJobStatus;
//   }

//   async getFetchTokensJob(
//     jobId: string,
//   ): Promise<AsyncJobStatusResponse | undefined> {
//     const result: any = await this.ocpiGraphqlClient.request(
//       GET_ASYNC_JOB_STATUS_QUERY,
//       { jobId },
//     );
//     return result.asyncJobStatus;
//   }

//   async getFetchTokensJobs(
//     tenantPartnerId: number,
//     active?: boolean,
//   ): Promise<AsyncJobStatusResponse[]> {
//     const whereConditions: any = {
//       jobName: AsyncJobName.FETCH_OCPI_TOKENS,
//       tenantPartnerId: tenantPartnerId,
//     };

//     if (active) {
//       whereConditions.finishedAt = null;
//       whereConditions.stoppedAt = null;
//     } else if (active === false) {
//       // Either finished or stopped
//       whereConditions.OR = [
//         { finishedAt: { not: null } },
//         { stoppedAt: { not: null } },
//       ];
//     }

//     const result: any = await this.ocpiGraphqlClient.request(
//       GET_ASYNC_JOB_STATUSES_QUERY,
//       { where: whereConditions },
//     );
//     return result.asyncJobStatuses || [];
//   }

//   async deleteFetchTokensJob(
//     jobId: string,
//   ): Promise<AsyncJobStatusResponse | undefined> {
//     const result: any = await this.ocpiGraphqlClient.request(
//       DELETE_ASYNC_JOB_STATUS_MUTATION,
//       { jobId },
//     );
//     return result.deleteAsyncJobStatus;
//   }

//   private async updateTokens(tokens: TokenDTO[]) {
//     for (const token of tokens) {
//       try {
//         const authorization =
//           TokensMapper.mapOcpiTokenToPartialOcppAuthorization(token);
//         const variables = {
//           idToken: authorization.idToken,
//           type: authorization.idTokenType,
//           countryCode: token.country_code,
//           partyId: token.party_id,
//           additionalInfo: authorization.additionalInfo,
//           status: authorization.status,
//           language1: authorization.language1,
//         };
//         const result = await this.ocpiGraphqlClient.request<any>(
//           UPDATE_TOKEN_MUTATION,
//           variables,
//         );
//         const updatedToken = result.updateToken;
//         if (!updatedToken) {
//           this.logger.error(`Failed to update token ${token.uid}`);
//         }
//       } catch (e) {
//         this.logger.error(`Failed to update token ${token.uid}`, e);
//       }
//     }
//   }
// }
