/**
 * @fileoverview Tests for lib/hosts/Host.js file.
 */

const AntFunction = require('../../../lib/functions/AntFunction');
const Host = require('../../../lib/hosts/Host');
const Provider = require('../../../lib/hosts/providers/Provider');
const Ant = require('../../../lib/Ant');

const provider = new Provider('fooProvider', jest.fn());
const fooConfig = { fooKey: 'fooValue' };
const host = new Host('fooHost', provider, fooConfig);

describe('lib/hosts/Host.js', () => {
  test('should export "Host" class', () => {
    expect(host.constructor.name).toEqual('Host');
  });

  test('should fail if the name is not String', () => {
    expect(() => new Host()).toThrowError(
      'Could not initialize Host: param "name" should be String'
    );
    expect(() => new Host({})).toThrowError(
      'Could not initialize Host: param "name" should be String'
    );
  });

  test('should fail if provider is not a Provider', () => {
    expect(() => new Host('fooHost')).toThrowError(
      'Could not initialize Host: param "provider" should be Provider'
    );
    expect(() => new Host('fooHost', {})).toThrowError(
      'Could not initialize Host: param "provider" should be Provider'
    );
  });

  test('should fail if config is not an Object', () => {
    expect(() => new Host('fooHost', provider, () => {})).toThrowError(
      'Could not initialize Host: param "config" should be Object'
    );
  });

  describe('Host.name', () => {
    test('should be readonly', () => {
      expect(host.name).toEqual('fooHost');
      host.name = 'otherHost';
      expect(host.name).toEqual('fooHost');
    });
  });

  describe('Host.provider', () => {
    test('should be readonly', () => {
      expect(host.provider).toEqual(provider);
      host.provider = new Provider('fooProvider');
      expect(host.provider).toEqual(provider);
    });
  });

  describe('Host.deploy', () => {
    test('should call provider deploy', async () => {
      const provider = new Provider('fooProvider', jest.fn());
      const functions = [new AntFunction(new Ant(), 'fooFunction')];
      (new Host('fooHost', provider, fooConfig)).deploy(functions);
      expect(provider.deploy).toHaveBeenCalledWith(fooConfig, functions);
    });
  });
});
