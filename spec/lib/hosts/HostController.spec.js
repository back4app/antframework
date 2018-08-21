/**
 * @fileoverview Tests for lib/hosts/HostController.js file.
 */

const Ant = require('../../../lib/Ant');
const Provider = require('../../../lib/hosts/providers/Provider');
const Host = require('../../../lib/hosts/Host');
const HostController = require('../../../lib/hosts/HostController');

const ant = new Ant();
const hostController = new HostController(ant);

describe('lib/hosts/HostController.js', () => {
  test('should export "HostController" class', () => {
    expect(hostController.constructor.name).toEqual('HostController');
  });

  test('should fail if "ant" param is not passed', () => {
    expect(() => new HostController()).toThrowError(
      'Could not initialize the host controller: param "ant" is required'
    );
  });

  test('should fail if "ant" param is not Ant', () => {
    expect(() => new HostController({})).toThrowError(
      'Could not initialize the host controller: param "ant" should be Ant'
    );
  });

  test('should fail to load functions due to invalid param type', () => {
    expect(() => new HostController(
      ant,
      'invalid_function_config'
    )).toThrowError(
      'Could not load hosts: param "hosts" should be Array'
    );
    expect(() => new HostController(
      ant,
      [() => {}]
    )).toThrowError(
      'should be an instance of Host'
    );
  });

  test('should load hosts', () => {
    const myCustomHost = new Host('fooHost', new Provider('fooProvider'));
    const hosts = [myCustomHost];
    const hostController = new HostController(ant, hosts);
    expect(hostController.hosts).toEqual(expect.any(Array));
    expect(hostController.hosts).toHaveLength(1);
    expect(hostController.hosts[0]).toEqual(myCustomHost);
    expect(() => hostController.getHost(
      myCustomHost.name).toEqual(myCustomHost));
  });

  describe('HostController.ant', () => {
    test('should be readonly', () => {
      expect(hostController.ant).toEqual(ant);
      hostController.ant = new Ant();
      expect(hostController.ant).toEqual(ant);
    });
  });

  describe('HostController.getHost', () => {
    test('should return null if host not found', () => {
      expect(hostController.getHost('NotExistent'))
        .toEqual(null);
    });
  });
});
