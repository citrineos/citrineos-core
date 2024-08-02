import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum EncryptionMethodEnumType {
  NONE = 'NONE', // TODO consider removing
  RSA = 'RSA'
}

/**
 * Represents existing public keys that can be configured on a charging station.
 *
 * Currently, supports only one public key, but will support more in the future.
 */
// TODO this table will currently only have one entry
// based on what's configured in transaction module :O
// TODO better name
@Table
export class PublicKeyInfo extends Model {
  @Column(DataType.STRING)
  publicKeyFileName!: string;

  @Column(DataType.STRING)
  privateKeyFileName!: string;

  @Column(DataType.STRING)
  encryptionMethod!: EncryptionMethodEnumType;
}