/**
 * @fileoverview Tests for lib/functions/AntFunction.js file.
 */

const Ant = require('../../../lib/Ant');
const AntFunction = require('../../../lib/functions/AntFunction');

const ant = new Ant();
const antFunction = new AntFunction(ant, 'fooFunction');

describe('lib/functions/AntFunction.js', () => {
  test('should export "AntFunction" class', () => {
    expect(antFunction.constructor.name).toEqual('AntFunction');
  });

  test('should fail if the name is not String', () => {
    expect(() => new AntFunction(ant)).toThrowError(
      'Could not initialize AntFunction: param "name" should be String'
    );
    expect(() => new AntFunction(ant, {})).toThrowError(
      'Could not initialize AntFunction: param "name" should be String'
    );
  });

  describe('AntFunction.name', () => {
    test('should be readonly', () => {
      expect(antFunction.name).toEqual('fooFunction');
      antFunction.name = 'otherFunction';
      expect(antFunction.name).toEqual('fooFunction');
    });
  });

  describe('AntFunction.run', () => {
    test('should return nothing if not implemented', async () => {
      const runReturn = antFunction.run();
      expect(runReturn).toEqual(undefined);
    });
  });
});
