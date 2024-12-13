// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IFileAccess, SystemConfig } from '@citrineos/base';
import AWS from 'aws-sdk';

export class S3Storage implements IFileAccess {
  private _s3: AWS.S3;
  protected readonly _config: SystemConfig;

  constructor(config: SystemConfig) {
    this._config = config;

    this._s3 = new AWS.S3({
      endpoint: `http://${this._config.util.fileAccess?.s3Storage?.endpointHost || 'localstack'}:${this._config.util.fileAccess?.s3Storage?.endpointPort || '4566'}`,
      accessKeyId:
        (this._config.util.fileAccess?.s3Storage?.accessKeyId as string) ||
        'null',
      secretAccessKey:
        (this._config.util.fileAccess?.s3Storage?.secretAccessKey as string) ||
        'null',
      s3ForcePathStyle: true,
    });
  }

  getFileURL(): string {
    return `http://localhost:4566/citrineos-s3-bucket/`;
  }

  async getFile(id: string): Promise<Buffer> {
    const bucketName: string = this._config.util.fileAccess?.s3Storage
      ?.bucketName as string;

    try {
      const result = await this._s3
        .getObject({
          Bucket: bucketName || 'citrineos-s3-bucket',
          Key: id,
        })
        .promise();

      if (result.Body instanceof Buffer) {
        return result.Body;
      } else {
        throw new Error('File content is not in Buffer format.');
      }
    } catch (e) {
      throw new Error(`Failed to get file ${id}: ${e}`);
    }
  }

  async uploadFile(
    fileName: string,
    content: Buffer,
    filePath?: string,
  ): Promise<string> {
    const bucketName: string = this._config.util.fileAccess?.s3Storage
      ?.bucketName as string;
    try {
      const result = await this._s3
        .upload({
          Bucket: bucketName || 'citrineos-s3-bucket',
          Key: `${filePath}${fileName}`,
          Body: content,
          ContentType: 'application/octet-stream',
        })
        .promise();

      return result.Location;
    } catch (e) {
      throw new Error(`Failed to upload file ${fileName}: ${e}`);
    }
  }
}
