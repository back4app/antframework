/**
 * @fileoverview Tests for lib/Ant.js file.
 */

const path = require('path');
const fs = require('fs');
const Ant = require('../../lib/Ant');
const AntCli = require('../../lib/cli/AntCli');
const Plugin = require('../../lib/plugins/Plugin');
const PluginController = require('../../lib/plugins/PluginController');
const TemplateController = require('../../lib/templates/TemplateController');
const Core = require('../../lib/plugins/core');
const yaml = require('yaml').default;

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
    const originalGetGlobalConfig = Ant.prototype._getGlobalConfig;
    Ant.prototype._getGlobalConfig = () => {
      return {};
    };
    try {
      const ant = new Ant();
      expect(ant._globalConfig).toEqual({});
      expect(ant.pluginController).toBeInstanceOf(PluginController);
      expect(ant.pluginController.plugins).toEqual(expect.any(Array));
      expect(ant.pluginController.plugins).toHaveLength(0);
    } finally {
      Ant.prototype._getGlobalConfig = originalGetGlobalConfig;
    }
  });

  test('should fail if global config cannot be read', () => {
    const originalParseDocument = yaml.parseDocument;
    yaml.parseDocument = () => { throw new Error('Mocked error'); };
    try {
      expect(() => new Ant()).toThrowError(
        /^Could not load config/
      );
    } catch (e) {
      throw e;
    } finally {
      yaml.parseDocument = originalParseDocument;
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

  describe('Ant.start', () => {
    test('should be async and call GraphQL plugin method', async () => {
      const originalCwd = process.cwd();
      process.chdir(path.resolve(
        __dirname,
        '../support/configs/graphQLPluginConfig'
      ));
      const antCli = new AntCli();
      const ant = antCli._ant;
      const startService = jest.fn();
      ant.pluginController.getPlugin('GraphQL').startService = startService;
      const startServiceReturn = ant.startService();
      expect(startServiceReturn).toBeInstanceOf(Promise);
      await startServiceReturn;
      expect(startService).toHaveBeenCalled();
      process.chdir(originalCwd);
    });
  });

  describe('Ant.addPlugin', () => {
    test('should be async and call Core plugin method', async () => {
      const ant = new Ant();
      const addPlugin = jest.fn();
      ant.pluginController.getPlugin('Core').addPlugin = addPlugin;
      const addPluginReturn = ant.addPlugin(
        'MyPlugin',
        true
      );
      expect(addPluginReturn).toBeInstanceOf(Promise);
      await addPluginReturn;
      expect(addPlugin).toHaveBeenCalledWith(
        'MyPlugin',
        true
      );
    });
  });

  describe('Ant.removePlugin', () => {
    test('should be async and call Core plugin method', async () => {
      const ant = new Ant();
      const core = ant.pluginController.getPlugin('Core');
      const removePlugin = jest.spyOn(core, 'removePlugin');
      const removePluginReturn = ant.removePlugin(
        'MyPlugin',
        true
      );
      expect(removePluginReturn).toBeInstanceOf(Promise);
      await removePluginReturn;
      expect(removePlugin).toHaveBeenCalledWith(
        'MyPlugin',
        true
      );
    });
  });

  describe('Ant.addTemplate', () => {
    test('should be async and call Core addTemplate method', async () => {
      const ant = new Ant();
      const core = ant.pluginController.getPlugin('Core');
      const originalAddTemplate = core.addTemplate;
      core.addTemplate = jest.fn();
      const addTemplateReturn = ant.addTemplate(
        'MyTemplate',
        '/path/to/my/template',
        'MyCategory',
        false
      );
      expect(addTemplateReturn).toBeInstanceOf(Promise);
      await addTemplateReturn;
      expect(core.addTemplate).toHaveBeenCalledWith(
        'MyTemplate',
        '/path/to/my/template',
        'MyCategory',
        false
      );
      core.addTemplate = originalAddTemplate;
    });
  });

  describe('Ant.removeTemplate', () => {
    test('should be async and call Core removeTemplate method', async () => {
      const ant = new Ant();
      const core = ant.pluginController.getPlugin('Core');
      const originalRemoveTemplate = jest.fn();
      core.removeTemplate = jest.fn();
      const removeTemplateReturn = ant.removeTemplate(
        'MyTemplate',
        'MyCategory',
        false
      );
      expect(removeTemplateReturn).toBeInstanceOf(Promise);
      await removeTemplateReturn;
      expect(core.removeTemplate).toHaveBeenCalledWith(
        'MyTemplate',
        'MyCategory',
        false
      );
      core.removeTemplate = originalRemoveTemplate;
    });
  });
});
