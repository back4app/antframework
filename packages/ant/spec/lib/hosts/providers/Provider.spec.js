/**
 * @fileoverview Tests for lib/hosts/providers/Provider.js file.
 */

const Provider = require('../../../../lib/hosts/providers/Provider');

const provider = new Provider('fooProvider');

describe('lib/hosts/providers/Provider.js', () => {
  test('should export "Provider" class', () => {
    expect(provider.constructor.name).toEqual('Provider');
  });

  test('should fail if the name is not String', () => {
    expect(() => new Provider()).toThrowError(
      'Could not initialize Provider: param "name" should be String'
    );
    expect(() => new Provider({})).toThrowError(
      'Could not initialize Provider: param "name" should be String'
    );
  });

  test('should fail if deployFunction is not a Function', () => {
    expect(() => new Provider('fooProvider', {})).toThrowError(
      'Could not initialize Provider: param "deployFunction" should be Function'
    );
  });

  describe('Provider.name', () => {
    test('should be readonly', () => {
      expect(provider.name).toEqual('fooProvider');
      provider.name = 'fooProvider';
      expect(provider.name).toEqual('fooProvider');
    });
  });

  describe('Provider.deploy', () => {
    test('should return nothing if not implemented', async () => {
      const deployReturn = provider.deploy();
      expect(deployReturn).toEqual(expect.any(Promise));
      expect(await deployReturn).toEqual(undefined);
    });
  });
});
