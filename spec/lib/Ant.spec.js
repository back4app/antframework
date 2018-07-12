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

  describe('Ant.createService', () => {
    test('should be async and call Core plugin method', async () => {
      const core = new Core();
      core.createService = jest.fn();
      const ant = new Ant({ plugins: [ core ]});
      const createServiceReturn = ant.createService(
        'FooService',
        'FooTemplate'
      );
      expect(createServiceReturn).toBeInstanceOf(Promise);
      await createServiceReturn;
      expect(core.createService).toHaveBeenCalledWith(
        'FooService',
        'FooTemplate'
      );
    });

    test('should fail if Core plugin not loaded', () => {
      const ant = new Ant({ plugins: [] });
      expect(ant.createService('FooService', 'FooTemplate'))
        .rejects.toThrowError(
          'Service could not be created because the Core plugin is not loaded.'
        );
    });

    test(
      'should fail if Core plugin does not have createService method',
      () => {
        /**
         * Represents a fake {@link Core} plugin with no createService method
         * for testing purposes.
         * @private
         */
        class FakeCore extends Plugin {
          get name() {
            return 'Core';
          }
        }
        const fakeCore = new FakeCore();
        const ant = new Ant({ plugins: [fakeCore] });
        expect(ant.createService('FooService', 'FooTemplate'))
          .rejects.toThrowError('Service could not be created:');
      });
  });
});
