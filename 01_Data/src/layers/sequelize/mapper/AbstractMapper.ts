import { Model } from 'sequelize-typescript';
import { OcppRequest, OcppResponse, OCPPVersion } from '@citrineos/base';

export abstract class AbstractMapper {
  protected _ocppVersion: OCPPVersion;

  protected constructor(ocppVersion: OCPPVersion) {
    this._ocppVersion = ocppVersion;
  }

  abstract fromRequestToModel(request: OcppRequest): Model;
  abstract fromResponseToModel(response: OcppResponse): Model;
  abstract fromModelToRequest(model?: Model): OcppRequest;
  abstract fromModelToResponse(model?: Model): OcppResponse;
}
