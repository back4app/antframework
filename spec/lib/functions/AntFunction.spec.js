/**
 * @fileoverview Tests for lib/functions/AntFunction.js file.
 */

const Ant = require('../../../lib/Ant');
const AntFunction = require('../../../lib/functions/AntFunction');
const Host = require('../../../lib/hosts/Host');
const Provider = require('../../../lib/hosts/providers/Provider');

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

  test('should fail if host is not a Host', () => {
    expect(() => new AntFunction(ant, 'fooFunction', undefined, {})).toThrowError(
      'Could not initialize AntFunction: param "host" should be Host'
    );
  });

  describe('AntFunction.name', () => {
    test('should be readonly', () => {
      expect(antFunction.name).toEqual('fooFunction');
      antFunction.name = 'otherFunction';
      expect(antFunction.name).toEqual('fooFunction');
    });
  });

  describe('AntFunction.host', () => {
    test('should be readonly', () => {
      expect(antFunction.host).toEqual(ant.host);
      antFunction.host = new Host('fooHost', new Provider('fooProvider'));
      expect(antFunction.host).toEqual(ant.host);
    });
  });

  describe('AntFunction.run', () => {
    test('should return nothing if not implemented', async () => {
      const runReturn = antFunction.run();
      expect(runReturn).toEqual(undefined);
    });
  });
});
