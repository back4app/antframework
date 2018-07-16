/**
 * @fileoverview Tests for lib/plugins/PluginController.js file.
 */

const yargs = require('yargs');
const Ant = require('../../../lib/Ant');
const Plugin = require('../../../lib/plugins/Plugin');
const PluginController = require('../../../lib/plugins/PluginController');
const Core = require('../../../lib/plugins/core');
const FooPlugin = require('./FooPlugin');
const NotAPlugin = require('./NotAPlugin');

const ant = new Ant();
const plugin = new Plugin(ant);

/**
 * Represents a fake {@link Plugin} class for testing purposes.
 * @extends Plugin
 * @private
 */
class MyPlugin extends Plugin {}

/**
 * Represents a fake {@link Plugin} class for testing purposes.
 * @extends FooPlugin
 * @private
 */
class MyOtherPlugin extends FooPlugin {}

/**
 * Represents a {@link Plugin} that overrides the "name" member and throws an
 * Error for testing purposes.
 * @private
 */
class NameErrorPlugin extends Plugin {
  get name() {
    throw new Error('Some name error');
  }
}

const nameErrorPlugin = new NameErrorPlugin(ant);

/**
 * Represents a {@link Plugin} that overrides the base constructor and throws an
 * Error for testing purposes.
 * @private
 */
class InitializationErrorPlugin extends Plugin {
  constructor(ant) {
    super(ant);

    throw new Error('Some initialization error');
  }
}

/**
 * Represents a {@link Plugin} that overrides the "loadYargsSettings" method and
 * throws an Error for testing purposes.
 * @private
 */
class YargsErrorPlugin extends NameErrorPlugin {
  loadYargsSettings() {
    throw new Error('Some yargs error');
  }
}

const yargsErrorPlugin = new YargsErrorPlugin(ant);

describe('lib/plugins/PluginController.js', () => {
  test('should export "PluginController" class', () => {
    const pluginController = new PluginController(ant);

    expect(pluginController.constructor.name).toEqual('PluginController');
  });

  test('should fail if the ant instance is not passed', () => {
    expect(() => new PluginController()).toThrowError(
      'Could not initialize the plugin controller: param "ant" is required'
    );
  });

  test('should fail if the ant param is not an Ant', () => {
    expect(() => new PluginController({})).toThrowError(
      'Could not initialize the plugin controller: param "ant" should be Ant'
    );
  });

  test('should initialize with no plugins and without errors', () => {
    const pluginController = new PluginController(ant);

    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(0);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(0);
  });

  test('should initialize with plugin array and without errors', () => {
    const pluginController = new PluginController(ant, [
      './core',
      ['../../spec/lib/plugins/FooPlugin', { a: 1, b: 2, c: 3}],
      MyPlugin,
      [MyOtherPlugin, { a: 4, b: 5, c: 6}],
      plugin
    ]);

    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(5);
    expect(pluginController.plugins[0]).toBeInstanceOf(Core);
    expect(pluginController.plugins[1]).toBeInstanceOf(FooPlugin);
    expect(pluginController.plugins[1].a).toEqual(1);
    expect(pluginController.plugins[1].b).toEqual(2);
    expect(pluginController.plugins[1].c).toEqual(3);
    expect(pluginController.plugins[2]).toBeInstanceOf(MyPlugin);
    expect(pluginController.plugins[3]).toBeInstanceOf(MyOtherPlugin);
    expect(pluginController.plugins[3].a).toEqual(4);
    expect(pluginController.plugins[3].b).toEqual(5);
    expect(pluginController.plugins[3].c).toEqual(6);
    expect(pluginController.plugins[4]).toEqual(plugin);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(0);
  });

  test('should fail if the passed "plugins" param is not an array', () => {
    expect(() => new PluginController(ant, {})).toThrowError(
      'Could not load plugins: param "plugins" should be Array'
    );
  });

  test('should not load plugin if it does not resolve', () => {
    const pluginController = new PluginController(ant, [
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
      const pluginController = new PluginController(ant, [nameErrorPlugin]);
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
    const pluginController = new PluginController(ant, [
      '../../spec/lib/plugins/FooPlugin',
      new FooPlugin(ant)
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

  test('should not load plugin with initialization error', () => {
    const pluginController = new PluginController(
      ant,
      [InitializationErrorPlugin, NotAPlugin]
    );
    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(0);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(2);
    expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[0].message)
      .toEqual(expect.stringContaining('Some initialization error'));
    expect(pluginController.loadingErrors[1]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[1].message)
      .toEqual(expect.stringContaining('it should be Plugin'));
  });

  test('should not load plugin initilized with another ant instance', () => {
    const pluginController = new PluginController(
      ant,
      [new Plugin(new Ant())]
    );
    expect(pluginController.plugins).toEqual(expect.any(Array));
    expect(pluginController.plugins).toHaveLength(0);
    expect(pluginController.loadingErrors).toEqual(expect.any(Array));
    expect(pluginController.loadingErrors).toHaveLength(1);
    expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
    expect(pluginController.loadingErrors[0].message)
      .toEqual(expect.stringContaining(
        'Could not load plugin: the framework used to initilize the plugin is \
different to this controller\'s'
      ));
  });

  describe('PluginController.plugins', () => {
    test('should be readonly', () => {
      const pluginController = new PluginController(ant, [
        '../../spec/lib/plugins/FooPlugin',
        new FooPlugin(ant)
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
      const pluginController = new PluginController(ant, [
        '../../spec/lib/plugins/FooPlugin',
        new FooPlugin(ant)
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

  describe('PluginController.getPlugin', () => {
    test('should return the plugin by its name', () => {
      const plugin = new Plugin(ant);
      const pluginController = new PluginController(ant, [plugin]);
      expect(pluginController.getPlugin('Plugin')).toEqual(plugin);
    });
  });

  describe('PluginController.getPluginName', () => {
    test('should return the plugin name', () => {
      const pluginController = new PluginController(ant, [plugin]);
      expect(pluginController.getPluginName(plugin)).toEqual(plugin.name);
    });

    test('should return the default name in the case of error', () => {
      const pluginController = new PluginController(ant);
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
      const pluginController = new PluginController(ant);
      expect(() => pluginController.getPluginName({})).toThrowError(
        'Could not get plugin name: param "plugin" should be Plugin'
      );
    });
  });

  describe('PluginController.loadPluginYargsSettings', () => {
    test('should load plugin\'s yargs settings', () => {
      const plugin = new Plugin(ant);
      plugin.loadYargsSettings = jest.fn();
      (new PluginController(ant)).loadPluginYargsSettings(plugin, yargs);
      expect(plugin.loadYargsSettings).toHaveBeenCalledWith(yargs);
    });

    test('should store loading error in the case of error', () => {
      const pluginController = new PluginController(ant);
      pluginController.loadPluginYargsSettings(yargsErrorPlugin, yargs);
      expect(pluginController.loadingErrors).toEqual(expect.any(Array));
      expect(pluginController.loadingErrors).toHaveLength(2);
      expect(pluginController.loadingErrors[0]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[0].message)
        .toEqual(expect.stringContaining('Some name error'));
      expect(pluginController.loadingErrors[1]).toBeInstanceOf(Error);
      expect(pluginController.loadingErrors[1].message)
        .toEqual(expect.stringContaining('Some yargs error'));
    });

    test('should fail if the "plugin" param is not a Plugin instance', () => {
      const pluginController = new PluginController(ant);
      expect(() => pluginController.loadPluginYargsSettings({}, yargs))
        .toThrowError('Could not load plugin\'s Yargs settings: param "plugin" \
should be Plugin');
    });
  });
});
