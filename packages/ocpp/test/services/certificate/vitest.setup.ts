// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// TODO wanted to reuse the same vitest.setup accross all modules but it does not work if putting
// into the root of the project next to vitest.config.ts as one would expect.
// TODO revist after adjusting to mono repo and simplifying module structure
import { vi } from 'vitest';
import type { Logger } from 'tslog';
import type { FastifyInstance } from 'fastify';

export const mockLoggerLog = vi.fn();
export const mockLoggerSilly = vi.fn();
export const mockLoggerTrace = vi.fn();
export const mockLoggerDebug = vi.fn();
export const mockLoggerInfo = vi.fn();
export const mockLoggerWarn = vi.fn();
export const mockLoggerError = vi.fn();
export const mockLoggerFatal = vi.fn();
export const mockLoggerGetSubLogger = vi.fn();
export const mockLogger = {
  log: mockLoggerLog,
  silly: mockLoggerSilly,
  trace: mockLoggerTrace,
  debug: mockLoggerDebug,
  info: mockLoggerInfo,
  warn: mockLoggerWarn,
  error: mockLoggerError,
  fatal: mockLoggerFatal,
  getSubLogger: mockLoggerGetSubLogger,
} as unknown as Logger<any>;

vi.mock('tslog', async () => {
  const actual = await vi.importActual('tslog');
  return {
    ...actual,
    Logger: vi.fn(() => mockLogger),
  };
});

export const mockFastifyInstance = {
  register: vi.fn(),
} as unknown as FastifyInstance;

vi.mock('fastify', async () => {
  const actual = await vi.importActual('fastify');
  return {
    ...actual,
    FastifyInstance: vi.fn(() => mockFastifyInstance),
  };
});

export const mockFileStorageGetFile = vi.fn();
export const mockFileStorageSaveFile = vi.fn();

export const mockFileStorage = {
  getFile: mockFileStorageGetFile,
  saveFile: mockFileStorageSaveFile,
} as any;

vi.mock('jsrsasign', () => {
  const mockX509 = class {
    hex = 'mockHex';
    readCertPEM() {}
    getSerialNumberHex() {
      return '1E240';
    }
    getIssuerString() {
      return '/CN=Test Issuer';
    }
    getSubjectString() {
      return '/C=US/O=Test Org/CN=localhost';
    }
    getNotAfter() {
      return '270217120000Z';
    }
    getSignatureAlgorithmName() {
      return 'SHA256withECDSA';
    }
    getSignatureAlgorithmField() {
      return 'SHA256withECDSA';
    }
  };

  const mockKJUR = {
    crypto: {
      Util: {
        sha256: () => 'mockHash',
      },
    },
    asn1: {
      x509: {
        Certificate: class {},
      },
      csr: {
        CSRUtil: {
          getParam: () => ({}),
        },
        CertificationRequest: class {},
      },
      ocsp: {
        // Add this
        OCSPRequest: class {},
        Request: class {},
      },
    },
  };

  const mockKEYUTIL = {
    generateKeypair: () => ({
      prvKeyObj: {},
      pubKeyObj: {},
    }),
    getPEM: () => 'mockPEM',
  };

  const exports = {
    X509: mockX509,
    KJUR: mockKJUR,
    KEYUTIL: mockKEYUTIL,
  };

  return {
    default: exports,
    ...exports,
  };
});
