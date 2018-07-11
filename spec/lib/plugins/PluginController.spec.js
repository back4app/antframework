/**
 * @fileoverview Tests for lib/plugins/PluginController.js file.
 */

const Plugin = require('../../../lib/plugins/Plugin');
const PluginController = require('../../../lib/plugins/PluginController');
const Core = require('../../../lib/plugins/core');
const FooPlugin = require('./FooPlugin');

const plugin = new Plugin();

/**
 * Represents a {@link Plugin} that overrides the "name" member and throws an
 * Error for testing purposes
 * @private
 */
class NameErrorPlugin extends Plugin {
  get name() {
    throw new Error('Some name error');
  }
}

const nameErrorPlugin = new NameErrorPlugin();

describe('lib/plugins/PluginController.js', () => {
  test('should export "PluginController" class', () => {
    const pluginController = new PluginController();

    expect(pluginController.constructor.name).toEqual('PluginController');
  });

  test('should initialize with no plugins and without errors', () => {
    const pluginController = new PluginController();

    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(0);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(0);
  });

  test('should initialize with plugin array and without errors', () => {
    const pluginController = new PluginController([
      './core',
      ['../../spec/lib/plugins/FooPlugin', { a: 1, b: 2, c: 3}],
      plugin
    ]);

    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(3);
    expect(pluginController.plugins[0]).toBeInstanceOf(Core);
    expect(pluginController.plugins[1]).toBeInstanceOf(FooPlugin);
    expect(pluginController.plugins[1].a).toEqual(1);
    expect(pluginController.plugins[1].b).toEqual(2);
    expect(pluginController.plugins[1].c).toEqual(3);
    expect(pluginController.plugins[2]).toEqual(plugin);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(0);
  });

  test('should fail if the passed "plugins" param is not an array', () => {
    expect(() => new PluginController({})).toThrowError(
      'Could not load plugins: param "plugins" should be Array'
    );
  });

  test('should not load plugin if it does not resolve', () => {
    const pluginController = new PluginController([
      './core',
      ['../../spec/lib/plugins/FooPlugin', { a: 1, b: 2, c: 3}],
      plugin,
      'InexistentFooPlugin',
      '../../spec/lib/plugins/NotAPlugin',
      {}
    ]);

    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(3);
    expect(pluginController.plugins[0]).toBeInstanceOf(Core);
    expect(pluginController.plugins[1]).toBeInstanceOf(FooPlugin);
    expect(pluginController.plugins[1].a).toEqual(1);
    expect(pluginController.plugins[1].b).toEqual(2);
    expect(pluginController.plugins[1].c).toEqual(3);
    expect(pluginController.plugins[2]).toEqual(plugin);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(3);
    expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[0].message)
      .toEqual(expect.stringContaining('InexistentFooPlugin'));
    expect(pluginController.loadingErrors[1]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[1].message)
      .toEqual(expect.stringContaining('NotAPlugin'));
    expect(pluginController.loadingErrors[2]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[2].message)
      .toEqual(expect.stringContaining(
        'Could not load plugin: param "plugin" should be String or Plugin'
      ));
  });

  test(
    'should load plugin which name member throws Error with default name and \
    loading error',
    () => {
      const pluginController = new PluginController([nameErrorPlugin]);
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      expect(pluginController.plugins[0]).toEqual(nameErrorPlugin);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Some name error'));
    }
  );

  test('should not load plugin twice', () => {
    const pluginController = new PluginController([
      '../../spec/lib/plugins/FooPlugin',
      new FooPlugin()
    ]);
    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(1);
    expect(pluginController.plugins[0]).toBeInstanceOf(FooPlugin);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(1);
    expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[0].message)
      .toEqual(expect.stringContaining('Plugin FooPlugin is already loaded'));
  });

  describe('PluginController.plugins', () => {
    test('should be readonly', () => {
      const pluginController = new PluginController([
        '../../spec/lib/plugins/FooPlugin',
        new FooPlugin()
      ]);
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      expect(pluginController.plugins[0]).toBeInstanceOf(FooPlugin);
      pluginController.plugins = [];
      expect(pluginController.plugins).toEqual(expect.any(Array));
      expect(pluginController.plugins).toHaveLength(1);
      expect(pluginController.plugins[0]).toBeInstanceOf(FooPlugin);
    });
  });

  describe('PluginController.loadingErrors', () => {
    test('should be readonly', () => {
      const pluginController = new PluginController([
        '../../spec/lib/plugins/FooPlugin',
        new FooPlugin()
      ]);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Plugin FooPlugin is already loaded'));
      pluginController.loadingErrors = [];
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Plugin FooPlugin is already loaded'));
    });
  });

  describe('PluginController.getPluginName', () => {
    test('should return the plugin name', () => {
      const pluginController = new PluginController([plugin]);
      expect(pluginController.getPluginName(plugin)).toEqual(plugin.name);
    });

    test('should return the default name in the case of error', () => {
      const pluginController = new PluginController();
      expect(pluginController.getPluginName(nameErrorPlugin)).toEqual(
        Plugin.GetPluginDefaultName(nameErrorPlugin)
      );
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(1);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Some name error'));
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      const pluginController = new PluginController();
      expect(() => pluginController.getPluginName({})).toThrowError(
        'Could not get plugin name: param "plugin" should be Plugin'
      );
    });
  });
});
