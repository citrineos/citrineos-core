import { SystemConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { faker } from '@faker-js/faker';
import { Hubject } from '../../../src/certificate/client/hubject';
import {
  aValidAuthorizationToken,
  aValidRootCertificates,
  aValidSignedContractData,
} from '../../providers/Hubject';

describe('Hubject', () => {
  const mockBaseURL = 'https://hubject.base.test';
  const mockTokenURL = 'https://hubject.token.test';
  const mockISOVersion = 'ISO15118-2';
  const mockBearerToken =
    'Bearer' +
    ' eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkJ3eEV0TkFGUnpSM3JlNVF2elM2QyJ9.eyJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vcm9sZSI6WyJBRE1JTiIsIk9FTSIsIkNQTyIsIk1PX0hVQkpFQ1RfUEtJIl0sImh0dHBzOi8vZXUucGx1Z25jaGFyZ2UtdGVzdC5odWJqZWN0LmNvbS9wY2lkIjpbIkhVQiIsImh1YiJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vZW1haWQiOlsiREVIVUIiLCJFTVA3NyJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vY2xpZW50X25hbWUiOlsiSHViamVjdCJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vY2xpZW50X2FwcCI6Ik9wZW4gVGVzdCBFbnZpcm9ubWVudCIsImlzcyI6Imh0dHBzOi8vYXV0aC5ldS5wbHVnbmNoYXJnZS5odWJqZWN0LmNvbS8iLCJzdWIiOiJvNTdRYXdxMW9uazdVa1pyaEZtRXFqU09NcWRoMzRSZ0BjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9ldS5wbHVnbmNoYXJnZS10ZXN0Lmh1YmplY3QuY29tIiwiaWF0IjoxNzIzNjExOTk3LCJleHAiOjE3MjM2OTgzOTcsInNjb3BlIjoicmNwc2VydmljZSBwY3BzZXJ2aWNlIGNjcHNlcnZpY2UgY3BzZXJ2aWNlIHBraWdhdGV3YXkiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMiLCJhenAiOiJvNTdRYXdxMW9uazdVa1pyaEZtRXFqU09NcWRoMzRSZyIsInBlcm1pc3Npb25zIjpbInJjcHNlcnZpY2UiLCJwY3BzZXJ2aWNlIiwiY2Nwc2VydmljZSIsImNwc2VydmljZSIsInBraWdhdGV3YXkiXX0.Ep81vOgj-IRAQ3BsxgdP52DImo7-5hcBKZYSOL7v8oi2HjopPc8KRUdqS6J-qly6uD4lREWw3MZpnm6RKpD5Xr7K337wkMVhlM86EnMUpc4iy975lTQGg4mg7l5rbtpDoY2PPnAawU9Ky0cTq23dNNlRwljKdbjLm6xMd6K_xX5LUm5QeP_qy9EeTvRiRYc086M3AoL-iPtau5pU_0IlvoFeB8BbiJxR5xp8OOFU5ma84MFNK6p-GX7m5oJf-T-wSB7hb6qtT-HbZbYL5Jkm1eDJmE3iEIvJGVve5KHSEYU5SLX4Mr6OAsImHl2qFrWPx0uWoep33M1__qCbT70o5g';

  let systemConfig: SystemConfig;
  let logger: Logger<ILogObj>;
  let hubject: Hubject;

  beforeAll(() => {
    global.fetch = jest.fn();

    systemConfig = {
      util: {
        certificateAuthority: {
          v2gCA: {
            name: 'hubject',
            hubject: {
              baseUrl: mockBaseURL,
              tokenUrl: mockTokenURL,
              isoVersion: mockISOVersion,
            },
          },
        },
      },
    } as any;
    hubject = new Hubject(systemConfig, logger!);
  });

  describe('getSignedContractData', () => {
    it('successes', async () => {
      (fetch as jest.Mock)
        .mockReturnValueOnce(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(aValidAuthorizationToken()),
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            text: () => Promise.resolve(JSON.stringify(aValidSignedContractData())),
          }),
        );

      const givenXsdMsgDefNamespace = faker.lorem.word();
      const givenCertificateInstallationReq = faker.lorem.word();
      const actualResult = await hubject.getSignedContractData(
        givenXsdMsgDefNamespace,
        givenCertificateInstallationReq,
      );

      // check return from getSignedContractData() method
      const expectedResult =
        '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zu7khM6KioKymIqcooqGgqKC7pbUgt6Ezs7khM6KjISixoaCpLLGwpCkYMaQmmyY8nJmyGbG6sKQrNLC2qzUyIZq1MRkYOzGjujgmPSCqITOnKyQppqKiIiCls6C0IqgaMZe2uKC7J7UgmSEzs7khM6KjISixoSCoqLimobO7pTOspKW7rKEhKKqkJqCjo6O2tBgyJCCbJjycGKa0mjwnPSi6pqogvKY1IpimtTeaJqIzu6agmiOgmKqyIjuioRe7qKKgu6ShITUgpaEzs7i0NbUnqCiooiCzpySgoiEjILShNjelOxm3HKS5spg0o7GbKCyVtzKrKqCgtb0csai6mRwVt6gjPRw6G7YxoKS0IKaxJCyZnCGgpCuspSI3vCG2GyOVmBWrqCS2MrwiNDCiu6m4IbM0sqe7ojsjgARTAKABjwgZNSUlDYXpDQ0FoR2dBd0lCQWdJUVZ2RlJkY21MMGFLT1RlRGxCaGlISURBS0JnZ3Foa2pPUFFRREFqQlFNUXN3Q1FZRFZRUUdFd0pFUlRFUU1BNEdBMVVFQ2hNSFNIVmlhbVZqZERFVE1CRUdDZ21TSm9tVDhpeGtBUmtXQTFZeVJ6RWFNQmdHQTFVRUF4TVJRMUJQSUZOMVlqRWdTVTVVUlZKT1FVd3dIaGNOTVRrd056STFNVEExTnpFMFdoY05NakV3TnpJMU1UQTFOekUwV2pCT01Rc3dDUVlEVlFRR0V3SkVSVEVPTUF3R0ExVUVDaE1GVG1WNGRYTXhHakFZQmdOVkJBTVRFVU5RVHlCVGRXSXlJRWxPVkVWU1RrRk1NUk13RVFZS0NaSW1pWlB5TEdRQkdSWURWakpITUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFWlBSc0hZdnZlZDIwUzVSSTFHTUdla1pkbE9iRHVneWsvcWZPZDF1T1cwTnhDSzRvcm9pZHM5RDJxZ0gwQk1QQ3g5OGpVTVFzenVQbHVlbSsrbEdocEtPQnpqQ0J5ekFTQmdOVkhSTUJBZjhFQ0RBR0FRSC9BZ0VBTUJFR0ExVWREZ1FLQkFoSzJTdFdwSDJHVHpCRkJnTlZIU0FFUGpBOE1Eb0dEQ3NHQVFRQmdzUTFBUUlCQURBcU1DZ0dDQ3NHQVFVRkJ3SUJGaHhvZEhSd2N6b3ZMM2QzZHk1b2RXSnFaV04wTG1OdmJTOXdhMmt2TUJNR0ExVWRJd1FNTUFxQUNFRlRkSlBTS3hlb01EWUdDQ3NHQVFVRkJ3RUJCQ293S0RBbUJnZ3JCZ0VGQlFjd0FZWWFhSFIwY0Rvdkx6VXlMakUzTkM0eE1ESXVNVFV5T2pnd09EQXdEZ1lEVlIwUEFRSC9CQVFEQWdFR01Bb0dDQ3FHU000OUJBTUNBMGdBTUVVQ0lRQ1hYemljWTJhK2pCQ3dsVFdGNDhrTEQzbml6NmY0aWtETmJuSnNDY1VYK1FJZ0lWUHVJaXNMaWdoVzhzb3N0U2ZMUkFJOWFSSmpIWFY5M2RtTWRVejcrRHM9VrACJMAoAGBwBSBUlEMS4AEUwCgAY5oFTUlJQjdUQ0NBWk9nQXdJQkFnSVFXYUNZWFdxSkVyUTJIcE9leDJ3UXRUQUtCZ2dxaGtqT1BRUURBakJPTVFzd0NRWURWUVFHRXdKRVJURU9NQXdHQTFVRUNoTUZUbVY0ZFhNeEdqQVlCZ05WQkFNVEVVTlFUeUJUZFdJeUlFbE9WRVZTVGtGTU1STXdFUVlLQ1pJbWlaUHlMR1FCR1JZRFZqSkhNQjRYRFRFNU1USXhNREUwTWpZeE5Wb1hEVEl3TVRBeE1ERXdOVGN3TUZvd0x6RVVNQklHQTFVRUNoTUxTSFZpYW1WamRDQkpibU14RnpBVkJnTlZCQU1URGtSRlEwZE9NREF3TURJd01EQXhNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUVBSkZBd25xT21jWno5Ry9qby9idFFDcHpGaHlkRzlCVkQzdlMzd3FoNmZhWHNJM3NDa3kvcXF4Y1pqS3dwWHV1WTVtSWNrSVJ4Y0NkdkdDS2xWaWRNNk55TUhBd0VRWURWUjBPQkFvRUNFdXpxMUUwTGhrYU1CTUdBMVVkSXdRTU1BcUFDRXJaSzFha2ZZWlBNRFlHQ0NzR0FRVUZCd0VCQkNvd0tEQW1CZ2dyQmdFRkJRY3dBWVlhYUhSMGNEb3ZMelV5TGpFM05DNHhNREl1TVRVeU9qZ3dPREF3RGdZRFZSMFBBUUgvQkFRREFnZUFNQW9HQ0NxR1NNNDlCQU1DQTBnQU1FVUNJSHNMQjJtMU9pNTJJSmYrUStDckJVdnRYWVNiYXUrdi8xUjFnMjJ2VkZIa0FpRUFqOWZDQUU0NUh1VW9Id29KbzgydjNQOUtpZnFiajhpdlFEYnlyVHNyMlBVPUcAi6YBQAMLgARTAKABjqgZNSUlDV2pDQ0FnQ2dBd0lCQWdJUVFEclZ1Qlp6ZTdvZm5vRWlXUTlZY2pBS0JnZ3Foa2pPUFFRREFqQTlNUXN3Q1FZRFZRUUdFd0pFUlRFT01Bd0dBMVVFQ2hNRlRtVjRkWE14SGpBY0JnTlZCQU1URlVoMVltcGxZM1FnVW05dmRDQkpUbFJGVWs1QlREQWVGdzB4T1RBM01qVXhNRFV5TkRsYUZ3MHlNekEzTWpVeE1EVXlORGxhTUZBeEN6QUpCZ05WQkFZVEFrUkZNUkF3RGdZRFZRUUtFd2RJZFdKcVpXTjBNUk13RVFZS0NaSW1pWlB5TEdRQkdSWURWakpITVJvd0dBWURWUVFERXhGRFVFOGdVM1ZpTVNCSlRsUkZVazVCVERCWk1CTUdCeXFHU000OUFnRUdDQ3FHU000OUF3RUhBMElBQkwxUm9ZY3FsR0RxMHBLMk1IbG1ra3BqNGFkOFQyT1JHWmZBWWF4V2JIc0l3QUx2MmJpSXRqcHNEK2RvK0licWFubUlEOHhuMnR2dmlYSlk4Y3YycTJtamdjNHdnY3N3RWdZRFZSMFRBUUgvQkFnd0JnRUIvd0lCQVRBUkJnTlZIUTRFQ2dRSVFWTjBrOUlyRjZnd1JRWURWUjBnQkQ0d1BEQTZCZ3dyQmdFRUFZTEVOUUVDQVFBd0tqQW9CZ2dyQmdFRkJRY0NBUlljYUhSMGNITTZMeTkzZDNjdWFIVmlhbVZqZEM1amIyMHZjR3RwTHpBVEJnTlZIU01FRERBS2dBaEVQNGMvbXFBdk9qQTJCZ2dyQmdFRkJRY0JBUVFxTUNnd0pnWUlLd1lCQlFVSE1BR0dHbWgwZEhBNkx5ODFNaTR4TnpRdU1UQXlMakUxTWpvNE1EZ3dNQTRHQTFVZER3RUIvd1FFQXdJQkJqQUtCZ2dxaGtqT1BRUURBZ05JQURCRkFpQmxvSnYzbjlJc2UwaUdjNlBZK25lVlVBQWt6OWNRdTI4K29QRno4dDdsY0FJaEFNYkhZMzhDQUhXWUpEb3hDbDZHKzArV1BJbGV4RGhhRXdTcENmaWVPd0R2RwAIpgFAAx4QMmpKShsL0hoaC0I7Ogu6ShILOkqKs7IykyMbamGDClp6oyojYhNDSkJKIgpaEzs7i0NbUnqCiooiC1ISimqLm7oaisoisoqKOiu6UiqSoiqKagmiOgmKqiobQmpCmkKzSwtqs1MiIiqiahIqOhs7appTe2qhw0vDWgqTWroJisvKk9IrCmoTOjoJiqoqC8JqkomKEoJKMnGKy1IrOpqpqqqSslJ6iqu7ukNDGnJqo1u6c9JJimqiCYpz0imCu0MacmtSK7pz0kmKaqIJinPSKYK7UhJ6aoubuhqKyiKyioo6K7pSKpKiKnpqC7o6CYqqKhtCajKjarGjIsJrwjtSCsoTOnKyEgpqoiqqcoqjyhKjIrpLykorYnqyKrKao1oyamqSa7oqispaGtJLa0rSg8piOooSOpLKIrNSUkJqM1u6K7rKQlt60kvTUYIaCorKSlt60kvTUYIiCosaIos6CirSgpOaQsuzsyshkYKZqpJJijpqOyta0yNiexIjqzvLWXuLMnshi6p6uYJzwhpZo3uTe0sjmcohk4s6QYISaoIbwcnDUqpqi5vTqoNjqytpWVtiO0OCWnoT01IaE8vSCpoTOnKyQpJqEgsxwioaIgo6CopBegs6KgpqEio6CYqrIiM6iloSC0JZkpuiu4JBkjqj0hIyEzpyskKaCiqDUgnCaiN6OiIbmjoKiooTO5qJigqKShIKIguKahs6OhobmjoKiqoyE7pKEjNDw3siQpO7G9N7smGbIZsjyat7IrpTitK6cYJjanOzEpnLuwmTW7JqEmo6CYqrIku6impqC4oKGioyoyJSgppbwyt6aiLKOhobmjoKiqoyE7oqEhIbe7paIgtqEzs7khM6KjISixu6CsrLCwpCkYMaI3uyY9KrymNSKZpyGaPCaiJLqmqiq8p7Uzu6eiILuiM6yiKykYKCCopBehIKiiILOio6agt6OhobijqaaaHKEgpqGgmDOgpqKqoaSooawsPTSxrJkwlbUhIbu2KiujGhw1piIZtzS9GzMaNLWiJzE3JTmhsaqsFaiks6SrKDqktLmmNLO0K5w5t7m6KbMmKSCknLCpJTUkLCscmbI2prIqvRuVojmeq1gBGmAUADA4ApAqSiGTQk4weWNsaWVRWW5ScDZQYkFwUFQxS25CRUlKQTFDTmRRbnVvVVlKT0lEMlFESXNWSU1zcXZabmlNdmIyY294c2lrACpMAoAGBwBSBUlEM2tISSbMrmyoxscGryiHJe7PDitI5o6vDEjOasbKqwcI6oloRs6NaK2nJgjnBwzGz0ll6IkM7EwvCoXuzayN7cothqpnLYyOqUVqDosOhqnoTqqPSQ7ubC1nrWAPiYBQAMDgCkCpKIaMQREVDR04wMDAwMjAwMDFgA=';
      expect(actualResult).toBe(expectedResult);
      // check args passed to fetch
      const expectedUrl = `${mockBaseURL}/v1/ccp/signedContractData`;
      const expectedRequestInit: RequestInit = {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: mockBearerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateInstallationReq: givenCertificateInstallationReq,
          xsdMsgDefNamespace: givenXsdMsgDefNamespace,
        }),
      };
      expect(fetch).toHaveBeenLastCalledWith(expectedUrl, expectedRequestInit);
    });
  });

  describe('getRootCertificates', () => {
    it('successes', async () => {
      (fetch as jest.Mock)
        .mockReturnValueOnce(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(aValidAuthorizationToken()),
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            text: () => Promise.resolve(JSON.stringify(aValidRootCertificates())),
          }),
        );

      const actualResult = await hubject.getRootCertificates();

      // check return from getRootCertificates() method
      const expectedResult = [
        '-----BEGIN CERTIFICATE-----\nMIICFjCCAbygAwIBAgIQbIqT2zas5F2twNToU49ArDAKBggqhkjOPQQDAjBYMQswCQYDVQQGEwJVUzEVMBMGA1UEChMMSHViamVjdCBJbmMuMRMwEQYKCZImiZPyLGQBGRYDVjJHMR0wGwYDVQQDExRVUyBWMkcgUm9vdCBDQSBRQSBHMjAgFw0yMDA1MTkyMTU5NTlaGA8yMDYwMDUxOTIxNTk1OVowWDELMAkGA1UEBhMCVVMxFTATBgNVBAoTDEh1YmplY3QgSW5jLjETMBEGCgmSJomT8ixkARkWA1YyRzEdMBsGA1UEAxMUVVMgVjJHIFJvb3QgQ0EgUUEgRzIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAR2/KiLLZNcg4l5jANoMMotv5eY252KPiMegm8N9gOdj3/vskoamOAPD18ot+jczZRwPrxgRhS0Jq4PwlIdCWibo2YwZDAPBgNVHRMBAf8EBTADAQH/MBEGA1UdDgQKBAhK2xerpZDAaDAZBgNVHSAEEjAQMA4GDCsGAQQBg64NAQIBAjATBgNVHSMEDDAKgAhK2xerpZDAaDAOBgNVHQ8BAf8EBAMCAQYwCgYIKoZIzj0EAwIDSAAwRQIhAMUGxn3tBpgOZ/JnaKgFinRufQYRhoTtxFjbNw5d4OebAiBZrbKEoMHbBiWz7dSfwGfmzMQbgqPoGA8SSpA1a053Gg==\n-----END CERTIFICATE-----\n',
        '-----BEGIN CERTIFICATE-----\nMIIBqjCCAVGgAwIBAgIQVxCaWc+R9k7esNEQSBW22jAKBggqhkjOPQQDAjA9MQswCQYDVQQGEwJERTEOMAwGA1UEChMFTmV4dXMxHjAcBgNVBAMTFUh1YmplY3QgUm9vdCBJTlRFUk5BTDAeFw0xOTA3MjUxMDQ3NThaFw0yNDA3MjUxMDQ3NThaMD0xCzAJBgNVBAYTAkRFMQ4wDAYDVQQKEwVOZXh1czEeMBwGA1UEAxMVSHViamVjdCBSb290IElOVEVSTkFMMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEj/frqHOQRfacyKNNDreXJTbVjrjBLart/OaNB8pV9HzWWhHdG3qkwYMCk7ip8Y/4hvZDAPCcTKNCAqjSqMg66qMzMDEwDwYDVR0TAQH/BAUwAwEB/zARBgNVHQ4ECgQIRD+HP5qgLzowCwYDVR0PBAQDAgEGMAoGCCqGSM49BAMCA0cAMEQCIHOz3U0fewDP/N7o/pFmDtoz12tyXk0V2IK5kIQN9LCnAiAG7bbNzTYFy2cGIGr8uCX9i8kPz43IWYhyGwI1vsUa+w==\n-----END CERTIFICATE-----\n',
      ];
      expect(actualResult).toStrictEqual(expectedResult);
      // check args passed to fetch
      const expectedUrl = `${mockBaseURL}/v1/root/rootCerts`;
      const expectedRequestInit: RequestInit = {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: mockBearerToken,
        },
      };
      expect(fetch).toHaveBeenLastCalledWith(expectedUrl, expectedRequestInit);
    });
  });

  describe('getSignedCertificate', () => {
    it('fails due to internal server error', async () => {
      (fetch as jest.Mock)
        .mockReturnValueOnce(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(aValidAuthorizationToken()),
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            status: 500,
            text: () => Promise.resolve('Internal Server Error'),
          }),
        );

      const givenCSRString = faker.lorem.word();
      await expect(() => hubject.getSignedCertificate(givenCSRString)).rejects.toThrow(
        'Get signed certificate response is unexpected: 500: Internal Server Error',
      );

      // check args passed to fetch
      const expectedUrl = `${mockBaseURL}/cpo/simpleenroll/${mockISOVersion}`;
      const expectedRequestInit: RequestInit = {
        method: 'POST',
        headers: {
          Accept: 'application/pkcs10',
          Authorization: mockBearerToken,
          'Content-Type': 'application/pkcs10',
        },
        body: givenCSRString,
      };
      expect(fetch).toHaveBeenLastCalledWith(expectedUrl, expectedRequestInit);
    });
  });

  describe('getCACertificates', () => {
    it('fails due to internal server error', async () => {
      (fetch as jest.Mock)
        .mockReturnValueOnce(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(aValidAuthorizationToken()),
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            status: 500,
            text: () => Promise.resolve('Internal Server Error'),
          }),
        );

      await expect(() => hubject.getCACertificates()).rejects.toThrow(
        'Get CA certificates response is unexpected: 500: Internal Server Error',
      );

      // check args passed to fetch
      const expectedUrl = `${mockBaseURL}/cpo/cacerts/${mockISOVersion}`;
      const expectedRequestInit: RequestInit = {
        method: 'GET',
        headers: {
          Accept: 'application/pkcs10, application/pkcs7',
          Authorization: mockBearerToken,
          'Content-Transfer-Encoding': 'application/pkcs10',
        },
      };
      expect(fetch).toHaveBeenLastCalledWith(expectedUrl, expectedRequestInit);
    });
  });
});
