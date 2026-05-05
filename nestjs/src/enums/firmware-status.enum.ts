// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum FirmwareStatusEnumType {
  Downloaded = 'Downloaded',
  DownloadFailed = 'DownloadFailed',
  Downloading = 'Downloading',
  DownloadScheduled = 'DownloadScheduled',
  DownloadPaused = 'DownloadPaused',
  Idle = 'Idle',
  InstallationFailed = 'InstallationFailed',
  Installing = 'Installing',
  Installed = 'Installed',
  InstallRebooting = 'InstallRebooting',
  InstallScheduled = 'InstallScheduled',
  InstallVerificationFailed = 'InstallVerificationFailed',
  InvalidSignature = 'InvalidSignature',
  SignatureVerified = 'SignatureVerified',
}
