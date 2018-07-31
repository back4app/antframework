/**
 * @fileoverview Tests for lib/Ant.js file.
 */

const fs = require('fs');
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
    expect(ant.pluginController.plugins).toHaveLength(2);
    expect(ant.pluginController.plugins[0]).toEqual(expect.any(Core));
    expect(ant.pluginController.plugins[1]).toEqual(expect.any(Plugin));
  });

  test('should load global config', () => {
    const ant = new Ant();
    expect(ant.pluginController).toBeInstanceOf(PluginController);
    expect(ant.pluginController.plugins).toEqual(expect.any(Array));
    expect(ant.pluginController.plugins).toHaveLength(1);
    expect(ant.pluginController.plugins[0]).toBeInstanceOf(Core);
  });

  test('should load empty global config', () => {
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = jest.fn(() => '');
    const ant = new Ant();
    expect(ant.pluginController).toBeInstanceOf(PluginController);
    expect(ant.pluginController.plugins).toEqual(expect.any(Array));
    expect(ant.pluginController.plugins).toHaveLength(0);
    fs.readFileSync = originalReadFileSync;
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

  test('should load global config base path', () => {
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = jest.fn(() => 'basePath: /foo/path');
    const ant = new Ant();
    expect(ant._globalConfig.basePath).toEqual('/foo/path');
    fs.readFileSync = originalReadFileSync;
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

    test('should load templates from config', () => {
      const customTemplatePath = '/path/to/my/custom';
      const fooPath = '/path/to/foo';
      const barPath = '/path/to/bar';
      const templatesConfig = {
        CustomCategory: {
          CustomTemplate: customTemplatePath,
          Foo: fooPath
        },
        Custom_2: {
          Bar: barPath
        }
      };
      const antWithTemplates = new Ant({ templates: templatesConfig});
      expect(antWithTemplates.templateController.getTemplate(
        'CustomCategory','CustomTemplate').path).toEqual(customTemplatePath);
      expect(antWithTemplates.templateController.getTemplate(
        'CustomCategory', 'Foo').path).toEqual(fooPath);
      expect(antWithTemplates.templateController.getTemplate(
        'CustomCategory', 'Bar')).toEqual(null);
      expect(antWithTemplates.templateController.getTemplate(
        'Custom_2', 'Bar').path).toEqual(barPath);
      expect(antWithTemplates.templateController.getTemplate(
        'Custom_3', 'Bar')).toEqual(null);
    });

    test('should throw error with invalid templates config', () => {
      expect(() => new Ant({ templates: 'this should\'ve been an object!'}))
        .toThrowError(
          'Error while loading templates from Ant\'s config file. \
The "template" configuration should be an object!'
        );
    });

    test('should throw error with invalid template category value', () => {
      const templatesConfig = {
        CustomCategory: 'this should\'ve been an object!'
      };
      expect(() => new Ant({ templates: templatesConfig })).toThrowError(
        'Error while loading templates from Ant\'s config file: \
Template category value is not an object!'
      );
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
      ant.pluginController._plugins = new Map();
      await expect(ant.createService('FooService', 'FooTemplate'))
        .rejects.toThrow(
          'Service could not be created'
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

  describe('Ant.installPlugin', () => {
    test('should be async and call Core plugin method', async () => {
      const ant = new Ant();
      const installPlugin = jest.fn();
      ant.pluginController.getPlugin('Core').installPlugin = installPlugin;
      const installPluginReturn = ant.installPlugin(
        'MyPlugin',
        true
      );
      expect(installPluginReturn).toBeInstanceOf(Promise);
      await installPluginReturn;
      expect(installPlugin).toHaveBeenCalledWith(
        'MyPlugin',
        true
      );
    });

    test('should fail if Core plugin not loaded', async () => {
      expect.hasAssertions();
      const ant = new Ant({ plugins: [] });
      ant.pluginController._plugins = new Map();
      await expect(ant.installPlugin('asdds'))
        .rejects.toThrow(
          'Plugin could not be installed'
        );
    });
  });
});
