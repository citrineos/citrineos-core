import { splitOnce } from '../../src/util/StringOperations';

describe('splitOnce', () => {
  it.each([
    ['some random string', ['', 'some random string']],
    [
      'cp001:SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
      ['', 'cp001:SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3'],
    ],
  ] as Array<[string, string[]]>)(
    'should return the whole string at second position when separator is an empty string',
    (value, expected) => {
      expect(splitOnce(value, '')).toEqual(expected);
    },
  );

  it.each([
    ['separatorAtEnd-', '-', ['separatorAtEnd', '']],
    ['cp001:', ':', ['cp001', '']],
    ['cp001 ', ' ', ['cp001', '']],
  ] as Array<[string, string, string[]]>)(
    'should split correctly when separator is at the end of the string',
    (value, separator, expected) => {
      expect(splitOnce(value, separator)).toEqual(expected);
    },
  );

  it.each([
    ['-separatorAtStart', '-', ['', 'separatorAtStart']],
    [
      ':SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
      ':',
      ['', 'SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3'],
    ],
    [
      ' SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
      ' ',
      ['', 'SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3'],
    ],
  ] as Array<[string, string, string[]]>)(
    'should split correctly when separator is at the start of the string',
    (value, separator, expected) => {
      expect(splitOnce(value, separator)).toEqual(expected);
    },
  );

  it.each([
    ['multiple----separators-at-once', '-', ['multiple', '---separators-at-once']],
    [
      'cp001:::SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
      ':',
      ['cp001', '::SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3'],
    ],
  ] as Array<[string, string, string[]]>)(
    'should split at the first occurrence when multiple consecutive separators are present',
    (value, separator, expected) => {
      expect(splitOnce(value, separator)).toEqual(expected);
    },
  );

  it.each([
    ['', '', ['', '']],
    ['-', '-', ['', '']],
    [':', ':', ['', '']],
    [' ', ' ', ['', '']],
    ['a', 'a', ['', '']],
  ] as Array<[string, string, string[]]>)(
    'should split into two empty strings when the entire string is the separator',
    (value, separator, expected) => {
      expect(splitOnce(value, separator)).toEqual(expected);
    },
  );

  it.each([
    ['', ':', ['', undefined]],
    ['no-separator-here', '|', ['no-separator-here', undefined]],
  ] as Array<[string, string, string[]]>)(
    'should return one string when no separator is found',
    (value, separator, expected) => {
      expect(splitOnce(value, separator)).toEqual(expected);
    },
  );

  it.each([
    ['just-separator', '-', ['just', 'separator']],
    ['two-separators-here', '-', ['two', 'separators-here']],
    ['just space', ' ', ['just', 'space']],
    ['two  spaces', ' ', ['two', ' spaces']],
    ['letter separator', 't', ['le', 'ter separator']],
    [
      'cp001:SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
      ':',
      ['cp001', 'SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3'],
    ],
  ] as Array<[string, string, string[]]>)(
    'should split "%s" by "%s" into %p',
    (value, separator, expected) => {
      expect(splitOnce(value, separator)).toEqual(expected);
    },
  );
});
