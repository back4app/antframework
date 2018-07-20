/**
 * @fileoverview Tests for lib/Ant.js file.
 */

const Ant = require('../../lib/Ant');
const Plugin = require('../../lib/plugins/Plugin');
const PluginController = require('../../lib/plugins/PluginController');
const TemplateController = require('../../lib/templates/TemplateController');
const Core = require('../../lib/plugins/core');

describe('lib/Ant.js', () => {
  test('should export "Ant" class', () => {
    const ant = new Ant();

    expect(ant.constructor.name).toEqual('Ant');
  });

  test('should load custom config', () => {
    const ant = new Ant({ plugins: [Plugin] });
    expect(ant.pluginController).toBeInstanceOf(PluginController);
    expect(ant.pluginController.plugins).toEqual(expect.any(Array));
    expect(ant.pluginController.plugins).toHaveLength(1);
    expect(ant.pluginController.plugins[0]).toEqual(expect.any(Plugin));
  });

  test('should load global config', () => {
    const ant = new Ant();
    expect(ant.pluginController).toBeInstanceOf(PluginController);
    expect(ant.pluginController.plugins).toEqual(expect.any(Array));
    expect(ant.pluginController.plugins).toHaveLength(1);
    expect(ant.pluginController.plugins[0]).toBeInstanceOf(Core);
  });

  test('should fail if global config cannot be read', () => {
    const yaml = require('js-yaml');
    const safeLoad = yaml.safeLoad;
    yaml.safeLoad = () => { throw new Error(); };
    try {
      expect(() => new Ant()).toThrowError(
        'Could not load global config'
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

  describe('Ant.templateController', () => {
    test('should be readonly', () => {
      const ant = new Ant();
      expect(ant.templateController).toBeInstanceOf(TemplateController);
      expect(ant.templateController.getTemplate('Service', 'Default').name)
        .toEqual('Default');
      ant.pluginController = null;
      expect(ant.templateController).toBeInstanceOf(TemplateController);
      expect(ant.templateController.getTemplate('Service', 'Default').name)
        .toEqual('Default');
    });
  });

  describe('Ant.createService', () => {
    test('should be async and call Core plugin method', async () => {
      const ant = new Ant();
      const createService = jest.fn();
      ant.pluginController.getPlugin('Core').createService = createService;
      const createServiceReturn = ant.createService(
        'FooService',
        'FooTemplate'
      );
      expect(createServiceReturn).toBeInstanceOf(Promise);
      await createServiceReturn;
      expect(createService).toHaveBeenCalledWith(
        'FooService',
        'FooTemplate'
      );
    });

    test('should fail if Core plugin not loaded', async () => {
      expect.hasAssertions();
      const ant = new Ant({ plugins: [] });
      await expect(ant.createService('FooService', 'FooTemplate'))
        .rejects.toThrow(
          'Service could not be created because the Core plugin is not loaded'
        );
    });

    test(
      'should fail if Core plugin createService method fails',
      async () => {
        expect.hasAssertions();
        /**
         * Represents a fake {@link Core} plugin with no createService method
         * for testing purposes.
         * @private
         */
        class FakeCore extends Core {
          get name() {
            return 'Core';
          }

          createService() {
            throw new Error('Some create service error');
          }
        }
        const ant = new Ant({ plugins: [FakeCore] });
        await expect(ant.createService('FooService', 'FooTemplate'))
          .rejects.toThrow('Service could not be created');
      });
  });
});
