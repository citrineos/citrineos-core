// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export interface ExceptionHandler {
  handle(error: FastifyError, request: FastifyRequest, reply: FastifyReply): void;
}
