/**
 * @fileoverview Tests for lib/Ant.js file.
 */

const Ant = require('../../lib/Ant');
const Plugin = require('../../lib/plugins/Plugin');
const PluginController = require('../../lib/plugins/PluginController');
const Core = require('../../lib/plugins/core');

describe('lib/Ant.js', () => {
  test('should export "Ant" class', () => {
    const ant = new Ant();

    expect(ant.constructor.name).toEqual('Ant');
  });

  test('should load custom config', () => {
    const plugin = new Plugin();
    const ant = new Ant({ plugins: [plugin] });
    expect(ant.pluginController).toBeInstanceOf(PluginController);
    expect(ant.pluginController.plugins).toEqual(expect.any(Array));
    expect(ant.pluginController.plugins).toHaveLength(1);
    expect(ant.pluginController.plugins[0]).toEqual(plugin);
  });

  test('should load default config', () => {
    const ant = new Ant();
    expect(ant.pluginController).toBeInstanceOf(PluginController);
    expect(ant.pluginController.plugins).toEqual(expect.any(Array));
    expect(ant.pluginController.plugins).toHaveLength(1);
    expect(ant.pluginController.plugins[0]).toBeInstanceOf(Core);
  });

  test('should fail if default config cannot be read', () => {
    const yaml = require('js-yaml');
    const safeLoad = yaml.safeLoad;
    yaml.safeLoad = () => { throw new Error(); };
    try {
      expect(() => new Ant()).toThrowError(
        'Could not load default config'
      );
    } catch (e) {
      throw e;
    } finally {
      yaml.safeLoad = safeLoad;
    }
  });

  describe('Ant.pluginController', () => {
    test('should be readonly', () => {
      const ant = new Ant();
      expect(ant.pluginController).toBeInstanceOf(PluginController);
      expect(ant.pluginController.plugins).toEqual(expect.any(Array));
      expect(ant.pluginController.plugins).toHaveLength(1);
      expect(ant.pluginController.plugins[0]).toBeInstanceOf(Core);
      ant.pluginController = null;
      expect(ant.pluginController).toBeInstanceOf(PluginController);
      expect(ant.pluginController.plugins).toEqual(expect.any(Array));
      expect(ant.pluginController.plugins).toHaveLength(1);
      expect(ant.pluginController.plugins[0]).toBeInstanceOf(Core);
    });
  });
});
