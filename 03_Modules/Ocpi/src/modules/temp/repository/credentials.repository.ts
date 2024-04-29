// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {SequelizeRepository} from '@citrineos/data/dist/layers/sequelize/repository/Base';
import {Credentials} from '../../../model/Credentials';
import {FastifyRequest} from 'fastify';
import {AuthorizationHeaderSchema} from '../schema/authorizationHeaderSchema';
import {Namespace} from '../util/namespace';

export class CredentialsRepository extends SequelizeRepository<Credentials> {

    public validateAuthentication(token: string): Promise<boolean> {
        try {
            return this.existsByKey(token, Namespace.Credentials);
        } catch (e) {
            return Promise.resolve(false); // todo throw 401/403?
        }
    }

}
