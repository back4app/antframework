/**
 * @fileoverview Tests for lib/plugins/Plugin.js file.
 */

const Ant = require('../../../lib/Ant');
const Plugin = require('../../../lib/plugins/Plugin');

const ant = new Ant();
const plugin = new Plugin(ant);

/**
 * Represents a foo {@link Plugin} that overrides the "name" member for testing
 * purposes
 * @private
 */
class Foo extends Plugin {
  get name() {
    return 'Overriden Name';
  }
}

const foo = new Foo(ant);

describe('lib/plugins/Plugin.js', () => {
  test('should export "Plugin" class', () => {
    expect(plugin.constructor.name).toEqual('Plugin');
  });

  test('should fail if the ant instance is not passed', () => {
    expect(() => new Plugin()).toThrowError(
      'Could not initialize plugin: param "ant" is required'
    );
  });

  test('should fail if the ant param is not an Ant', () => {
    expect(() => new Plugin({})).toThrowError(
      'Could not initialize plugin: param "ant" should be Ant'
    );
  });

  describe('Plugin.GetPluginDefaultName', () => {
    test('should return the class name by default', () => {
      expect(Plugin.GetPluginDefaultName(foo)).toEqual('Foo');
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      expect(() => Plugin.GetPluginDefaultName({})).toThrowError(
        'Could not get plugin name: param "plugin" should be Plugin'
      );
    });
  });

  describe('Plugin.name', () => {
    test('should return the default name if not overriden', () => {
      expect(plugin.name).toEqual(Plugin.GetPluginDefaultName(plugin));
    });

    test('should return the new name if overriden', () => {
      expect(foo.name).toEqual('Overriden Name');
    });

    test('should be readonly', () => {
      expect(plugin.name).toEqual('Plugin');
      plugin.name = 'Foo';
      expect(plugin.name).toEqual('Plugin');
    });
  });

  describe('Plugin.loadYargsSettings', () => {
    test('should do nothing if not overriden', () => {
      const yargs = {};
      (new Plugin(ant)).loadYargsSettings(yargs);
      expect(yargs).toEqual({});
    });
  });
});
