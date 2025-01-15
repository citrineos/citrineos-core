import { expect } from '@jest/globals';
import { Boot, VariableAttribute } from '../../../../../src';
import { faker } from '@faker-js/faker';
import { OCPP2_0_1 } from '@citrineos/base';
import { BootMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';

describe('BootMapper', () => {
  describe('map Boot and BootMapper', () => {
    const givenSetVariable: OCPP2_0_1.SetVariableResultType = {
      attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
      component: {
        name: faker.lorem.word(),
        instance: faker.string.uuid(),
      },
      variable: {
        name: faker.lorem.word(),
        instance: faker.string.uuid(),
      },
      customData: {
        vendorId: faker.string.uuid(),
      },
      attributeType: OCPP2_0_1.AttributeEnumType.Actual,
      attributeStatusInfo: {
        reasonCode: faker.lorem.word(),
        additionalInfo: faker.lorem.sentence(),
      },
    };
    const givenBoot: Boot = {
      id: faker.string.uuid(),
      lastBootTime: faker.date.recent().toISOString(),
      heartbeatInterval: faker.number.int({ min: 30, max: 3600 }),
      bootRetryInterval: faker.number.int({ min: 30, max: 3600 }),
      status: 'Pending',
      getBaseReportOnPending: false,
      variablesRejectedOnLastBoot: [givenSetVariable],
      pendingBootSetVariables: [
        {
          stationId: faker.string.uuid(),
          evseDatabaseId: faker.number.int({ min: 0, max: 100 }),
          dataType: OCPP2_0_1.DataEnumType.string,
          type: OCPP2_0_1.AttributeEnumType.Actual,
          value: 'test',
          mutability: OCPP2_0_1.MutabilityEnumType.ReadWrite,
          persistent: false,
          constant: false,
          generatedAt: faker.date.recent().toISOString(),
          variableId: faker.number.int({ min: 0, max: 100 }),
          componentId: faker.number.int({ min: 0, max: 100 }),
        } as VariableAttribute,
      ],
      bootWithRejectedVariables: faker.datatype.boolean(),
    } as Boot;

    it('should be equal after mapping', () => {
      const actualMapper = new BootMapper(givenBoot);

      expect(actualMapper).toBeTruthy();
      expect(actualMapper.toModel()).toEqual(givenBoot);
    });

    it('should throw error when missing required fields', () => {
      const bootMissingRequiredFields: Boot = { ...givenBoot } as Boot;
      bootMissingRequiredFields.variablesRejectedOnLastBoot = null;

      expect(() => new BootMapper(bootMissingRequiredFields)).toThrowError('Missing variablesRejectedOnLastBoot');
    });

    it('should throw error when invalid boot status', () => {
      const bootWithInvalidStatus: Boot = { ...givenBoot } as Boot;
      console.log(`bootWithInvalidStatus: ${JSON.stringify(bootWithInvalidStatus)}`, `status: ${bootWithInvalidStatus}`);
      bootWithInvalidStatus.status = 'InvalidStatus';

      expect(() => new BootMapper(bootWithInvalidStatus)).toThrowError('Invalid boot status: InvalidStatus');
    });
  });
});
