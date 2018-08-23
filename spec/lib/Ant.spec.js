/**
 * @fileoverview Tests for lib/Ant.js file.
 */

const path = require('path');
const fs = require('fs');
const Ant = require('../../lib/Ant');
const AntCli = require('../../lib/cli/AntCli');
const Plugin = require('../../lib/plugins/Plugin');
const PluginController = require('../../lib/plugins/PluginController');
const Serverless = require('../../lib/plugins/serverless');
const TemplateController = require('../../lib/templates/TemplateController');
const Runtime = require('../../lib/functions/runtimes/Runtime');
const RuntimeController = require('../../lib/functions/runtimes/RuntimeController');
const FunctionController = require('../../lib/functions/FunctionController');
const Core = require('../../lib/plugins/core');
const yaml = require('yaml').default;

describe('lib/Ant.js', () => {
  test('should export "Ant" class', () => {
    const ant = new Ant();

    expect(ant.constructor.name).toEqual('Ant');
  });

  test('should load custom config', () => {
    const ant = new Ant({
      plugins: [
        Plugin,
        Serverless
      ],
      hosts: { FooHost: { provider: 'Serverless' }}
    });
    expect(ant.pluginController).toBeInstanceOf(PluginController);
    expect(ant.pluginController.plugins).toEqual(expect.any(Array));
    expect(ant.pluginController.plugins).toHaveLength(3);
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

  describe('Ant.functionController', () => {
    test('should be readonly', () => {
      const ant = new Ant();
      expect(ant.functionController).toBeInstanceOf(FunctionController);
      ant.functionController = null;
      expect(ant.functionController).toBeInstanceOf(FunctionController);
    });

    test('should load functions from config', () => {
      const ant = new Ant({
        functions: {
          Bin: {
            bin: '/path/to/bin'
          },
          Lib: {
            handler: '/path/to/handler',
            runtime: 'Default'
          }
        }
      });
      expect(ant.functionController.getFunction('Bin').bin).toBe('/path/to/bin');
      expect(ant.functionController.getFunction('Lib').handler).toBe('/path/to/handler');
    });
  });

  describe('Ant.runtimeController', () => {
    test('should be readonly', () => {
      const ant = new Ant();
      expect(ant.runtimeController).toBeInstanceOf(RuntimeController);
      ant.functionController = null;
      expect(ant.runtimeController).toBeInstanceOf(RuntimeController);
    });

    test('should load runtimes from config', () => {
      const runtimes = {
        Bin: {
          bin: '/path/to/bin',
          extensions: ['js', 'py']
        },
        Lib: {
          bin: '/path/to/lib',
          extensions: ['cpp', 'c', 'h']
        }
      };
      const ant = new Ant({ runtimes });
      const binRuntime = ant.runtimeController.getRuntime('Bin');
      expect(binRuntime).toBeInstanceOf(Runtime);
      expect(binRuntime.name).toBe('Bin');
      expect(binRuntime.bin).toBe(runtimes.Bin.bin);
      expect(binRuntime.extensions).toBe(runtimes.Bin.extensions);

      const libRuntime = ant.runtimeController.getRuntime('Lib');
      expect(libRuntime.name).toBe('Lib');
      expect(libRuntime.bin).toBe(runtimes.Lib.bin);
      expect(libRuntime.extensions).toBe(runtimes.Lib.extensions);
    });
  });

  describe('Ant.runtime', () => {
    test('should be readonly', () => {
      const ant = new Ant();
      expect(ant.runtime).toBeInstanceOf(Runtime);
      expect(ant.runtime.name)
        .toEqual('Default');
      ant.runtime = null;
      expect(ant.runtime).toBeInstanceOf(Runtime);
      expect(ant.runtime.name)
        .toEqual('Default');
    });
  });

  describe('Ant.host', () => {
    test('should be readonly', () => {
      const ant = new Ant();
      expect(ant.host).toEqual(null);
      ant.host = {};
      expect(ant.host).toEqual(null);
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
         * Represents a fake {@link Core} plugin with createService method
         * throwing error for testing purposes.
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

  describe('Ant.deployService', () => {
    test('should be async and call Core plugin method', async () => {
      const ant = new Ant();
      const deployService = jest.fn();
      ant.pluginController.getPlugin('Core').deployService = deployService;
      const deployServiceReturn = ant.deployService();
      expect(deployServiceReturn).toBeInstanceOf(Promise);
      await deployServiceReturn;
      expect(deployService).toHaveBeenCalledWith();
    });

    test(
      'should fail if Core plugin deployService method fails',
      async () => {
        expect.hasAssertions();
        /**
         * Represents a fake {@link Core} plugin with deployService method
         * throwing error for testing purposes.
         * @private
         */
        class FakeCore extends Core {
          get name() {
            return 'Core';
          }

          deployService() {
            throw new Error('Some deploy service error');
          }
        }
        const ant = new Ant({ plugins: [FakeCore] });
        await expect(ant.deployService())
          .rejects.toThrow('Service could not be deployed');
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
        'MyCategory',
        'MyTemplate',
        '/path/to/my/template',
        false
      );
      expect(addTemplateReturn).toBeInstanceOf(Promise);
      await addTemplateReturn;
      expect(core.addTemplate).toHaveBeenCalledWith(
        'MyCategory',
        'MyTemplate',
        '/path/to/my/template',
        false
      );
      core.addTemplate = originalAddTemplate;
    });
  });

  describe('Ant.removeTemplate', () => {
    test('should be async and call Core removeTemplate method', async () => {
      const ant = new Ant();
      const core = ant.pluginController.getPlugin('Core');
      core.removeTemplate = jest.fn();
      const removeTemplateReturn = ant.removeTemplate(
        'MyCategory',
        'MyTemplate',
        false
      );
      expect(removeTemplateReturn).toBeInstanceOf(Promise);
      await removeTemplateReturn;
      expect(core.removeTemplate).toHaveBeenCalledWith(
        'MyCategory',
        'MyTemplate',
        false
      );
    });
  });

  describe('Ant.addFunction', () => {
    test('should be async and call Core addFunction method', async () => {
      const ant = new Ant();
      const core = ant.pluginController.getPlugin('Core');
      core.addFunction = jest.fn();
      const addFunctionReturn = ant.addFunction('myFunc', '/mypath', 'runtime', true);
      expect(addFunctionReturn).toBeInstanceOf(Promise);
      await addFunctionReturn;
      expect(core.addFunction).toHaveBeenCalledWith('myFunc', '/mypath', 'runtime', true);
    });
  });

  describe('Ant.removeFunction', () => {
    test('should be async and call Core removeFunction method', async () => {
      const ant = new Ant();
      const core = ant.pluginController.getPlugin('Core');
      core.removeFunction = jest.fn();
      const removeFunctionReturn = ant.removeFunction('myFunc', true);
      expect(removeFunctionReturn).toBeInstanceOf(Promise);
      await removeFunctionReturn;
      expect(core.removeFunction).toHaveBeenCalledWith('myFunc', true);
    });
  });

  describe('Ant.listFunctions', () => {
    test('should be async and call Core listFunctions method', async () => {
      const ant = new Ant();
      const core = ant.pluginController.getPlugin('Core');
      core.listFunctions = jest.fn();
      const listFunctionsReturn = ant.listFunctions();
      expect(listFunctionsReturn).toBeInstanceOf(Promise);
      await listFunctionsReturn;
      expect(core.listFunctions).toHaveBeenCalled();
    });
  });

  describe('Ant.execFunction', () => {
    test('should be async and call Core execFunction method', async () => {
      const ant = new Ant();
      const core = ant.pluginController.getPlugin('Core');
      core.execFunction = jest.fn();
      const execFunctionReturn = ant.execFunction(
        'MyFunc',
        ['foo', 'bar']
      );
      expect(execFunctionReturn).toBeInstanceOf(Promise);
      await execFunctionReturn;
      expect(core.execFunction).toHaveBeenCalledWith(
        'MyFunc',
        ['foo', 'bar']
      );
    });
  });

  describe('Ant.addRuntime', () => {
    test('should be async and call Core addRuntime method', async () => {
      const params = ['myRuntime', '/my/runtime/path', ['nodejs', 'python'], true];
      await _assertCoreAsyncCall('addRuntime', params, params);
    });
  });

  describe('Ant.removeRuntime', () => {
    test('should be async and call Core removeRuntime method', async () => {
      const params = ['myRuntime', true ];
      await _assertCoreAsyncCall('removeRuntime', params, params);
    });
  });

  describe('Ant.listRuntimes', () => {
    test('should be async and call Core listRuntimes method', async () => {
      await _assertCoreAsyncCall('listRuntimes');
    });
  });
});

/**
 * Asserts a Core function call though an Ant function.
 * Invokes the Ant function given an array of parameters, and asserts the parameters
 * used to invoke the internal Core function.
 *
 * @param {!String} coreFunction The Core function to be invoked
 * @param {Array} params The parameters to be provided to Ant
 * @param {Array} expectedCoreFunctionParams The parameters expected to reach the Core function
 */
const _assertCoreAsyncCall = async (coreFunction, params = [], expectedCoreFunctionParams = []) => {
  const ant = new Ant();

  // Mocks the Core function
  const core = ant.pluginController.getPlugin('Core');
  core[coreFunction] = jest.fn();

  // Invokes the Ant function with "params"
  const antFunctionReturn = ant[coreFunction](...params);
  expect(antFunctionReturn).toBeInstanceOf(Promise);
  await antFunctionReturn;

  // Asserts Core function parameters with "expectedCoreFunctionParams"
  expect(core[coreFunction]).toHaveBeenCalledWith(...expectedCoreFunctionParams);
};
