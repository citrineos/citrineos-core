import { Model } from 'sequelize-typescript';

export abstract class AbstractMapper {
  abstract toModel(): Model;
}
