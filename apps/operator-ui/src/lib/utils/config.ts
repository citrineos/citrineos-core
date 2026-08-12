// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type AuthProviderType, AuthProviderTypeEnum } from '../providers/auth-provider/types';

const getConfig: () => {
  appName: string;
  googleMapsApiKey: string;
  googleMapsAddressApiKey: string;
  googleMapsLocationPickerMapId?: string;
  googleMapsOverviewMapId?: string;
  defaultMapCenterLatitude: number;
  defaultMapCenterLongitude: number;
  hasuraAdminSecret?: string; // Not recommended for use in production; use your authProvider instead.
  hasuraClaim?: string;
  tenantId: string;
  apiUrl: string;
  wsUrl: string;
  bannerMessage?: string;
  citrineCoreUrl?: string;
  fileServer?: string;
  logoUrl?: string;
  adminEmail?: string;
  adminPassword?: string;
  authProvider: AuthProviderType;
  keycloakUrl?: string; // The publicly accessible Keycloak URL that user browsers will be redirected to for login.
  keycloakServerUrl?: string; // If your application server needs to use a different URL to reach Keycloak (e.g., an internal service URL in Kubernetes), set this. Otherwise, the server will use KEYCLOAK_URL.
  keycloakRealm?: string;
  keycloakClientId?: string;
  keycloakClientSecret?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string; // Optional. Needed for temporary credentials
  awsS3BucketName?: string;
  awsS3CoreBucketName?: string;
  fileStorageType?: string;
  gcpCloudStorageBucketName?: string;
  gcpCloudStorageCoreBucketName?: string;
  helpVideoUrl?: string;
  allowImageUpload: boolean;
} = () => {
  const authProviderResult = AuthProviderTypeEnum.safeParse(process.env.NEXT_PUBLIC_AUTH_PROVIDER);
  const authProvider = authProviderResult.success ? authProviderResult.data : 'generic';

  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'CitrineOS',
    bannerMessage: process.env.NEXT_PUBLIC_BANNER_MESSAGE,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
    googleMapsAddressApiKey:
      process.env.GOOGLE_MAPS_ADDRESS_API_KEY || 'YOUR_GOOGLE_MAPS_ADDRESS_API_KEY',
    googleMapsLocationPickerMapId:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_LOCATION_PICKER_MAP_ID || 'location-picker-map-id',
    googleMapsOverviewMapId:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_OVERVIEW_MAP_ID || 'overview-map-id',
    defaultMapCenterLatitude: process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LATITUDE
      ? parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LATITUDE)
      : 39.833333, // Approximate center of contiguous USA
    defaultMapCenterLongitude: process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LONGITUDE
      ? parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LONGITUDE)
      : -98.583333, // Approximate center of contiguous USA
    hasuraAdminSecret: process.env.HASURA_ADMIN_SECRET,
    hasuraClaim: process.env.NEXT_PUBLIC_HASURA_CLAIM || 'https://hasura.io/jwt/claims',
    tenantId: process.env.NEXT_PUBLIC_TENANT_ID || '1',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090/v1/graphql',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8090/v1/graphql',
    citrineCoreUrl: process.env.NEXT_PUBLIC_CITRINE_CORE_URL,
    fileServer: process.env.NEXT_PUBLIC_FILE_SERVER_URL,
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL,
    adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    authProvider,
    keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    keycloakServerUrl: process.env.KEYCLOAK_SERVER_URL,
    keycloakRealm: process.env.KEYCLOAK_REALM,
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsSessionToken: process.env.AWS_SESSION_TOKEN,
    fileStorageType: process.env.FILE_STORAGE_TYPE || 's3',
    gcpCloudStorageBucketName: process.env.GCP_CLOUD_STORAGE_BUCKET_NAME,
    gcpCloudStorageCoreBucketName: process.env.GCP_CLOUD_STORAGE_CORE_BUCKET_NAME,
    awsS3BucketName: process.env.AWS_S3_BUCKET_NAME || 'YOUR_AWS_S3_BUCKET_NAME',
    awsS3CoreBucketName: process.env.AWS_S3_CORE_BUCKET_NAME || 'YOUR_AWS_S3_CORE_BUCKET_NAME',
    helpVideoUrl: process.env.NEXT_PUBLIC_HELP_VIDEO_URL || '/videos/help-video.mp4', // Default local path; override with env var for external URLs
    allowImageUpload: process.env.ALLOW_IMAGE_UPLOAD === 'true',
  };
};

export default getConfig();
