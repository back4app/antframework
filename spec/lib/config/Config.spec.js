/* eslint-disable no-console */
/**
 * @fileoverview Tests for lib/Config.js file.
 */
const AntError = require('../../../lib/util/AntError');
const Config = require('../../../lib/config/Config');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const process = require('process');
const yaml = require('yaml').default;
const Ant = require('../../../lib/Ant');
const BinFunction = require('../../../lib/functions/BinFunction');
const LibFunction = require('../../../lib/functions/LibFunction');
const Runtime = require('../../../lib/functions/runtimes/Runtime');
const { AssertionError } = require('assert');

describe('lib/config/Config.js', () => {
  const originalCwd = process.cwd();
  const outPath = path.resolve(
    __dirname,
    '../support/out/lib/Config.js',
    'out' + Math.floor(Math.random() * 1000)
  );

  beforeEach(() => {
    try {
      fsExtra.removeSync(outPath);
    } finally {
      try {
        fsExtra.ensureDirSync(outPath);
      } finally {
        process.chdir(outPath);
      }
    }
  });

  afterEach(() => {
    try {
      fsExtra.removeSync(outPath);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('should export "Config" class', () => {
    const config = new Config(path.resolve(outPath, 'ant.yml'));
    expect(config.constructor.name).toEqual('Config');
  });

  test('should create an instance of Config', () => {
    const config = new Config(path.resolve(outPath, 'ant.yml'));
    expect(config).toBeDefined();
  });

  test('should return config file path', () => {
    const filePath = path.resolve(outPath, 'ant.yml');
    const config = new Config(filePath);
    expect(config.path).toBe(filePath);
  });

  test('should return config JSON representation', () => {
    const filePath = path.resolve(outPath, 'antJSONtest.yml');
    try{
      fs.writeFileSync(filePath, 'basePath: $GLOBAL\n\
plugins:\n  - ../spec/support/plugins/FooPlugin\n\
templates:\n  MyCategory:\n    MyTemplate: /my/template/path\n');
      const config = new Config(filePath);
      expect(config.config).toEqual({
        basePath: path.resolve(__dirname, '../../../lib'),
        plugins: [ path.resolve(__dirname, '../../support/plugins/FooPlugin.js') ],
        templates: {
          MyCategory: {
            MyTemplate: '/my/template/path'
          }
        }
      });
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('should return cached JSON representation', () => {
    const filePath = path.resolve(outPath, 'antJSONCacheTest.yml');
    try{
      fs.writeFileSync(filePath, 'basePath: $GLOBAL\n\
plugins:\n  - ../spec/support/plugins/FooPlugin\n\
templates:\n  MyCategory:\n    MyTemplate: /my/template/path\n');
      const config = new Config(filePath);
      const firstCallJson = config.config;
      expect(firstCallJson).toBe(config.config);
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('should return config empty JSON representation', () => {
    const filePath = path.resolve(outPath, 'antJSONtest.yml');
    try{
      fs.writeFileSync(filePath, '');
      const config = new Config(filePath);
      expect(config.config).toEqual({ basePath: outPath });
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  describe('save', () => {
    test(
      'should save a config object given a path',
      () => {
        const config = new Config({ plugins: ['/test/save'] });
        const configPath = path.resolve(outPath, 'ant.yml');
        config.save(configPath);
        expect(fs.readFileSync(configPath, 'utf-8')).toBe('plugins:\n  - /test/save\n');
        expect(config.path).toBe(configPath);
      }
    );

    test('should fail to save config if no path was provided', () => {
      const config = new Config({ plugins: ['/test/save'] });
      try {
        config.save();
      } catch(e) {
        expect(e).toBeInstanceOf(AntError);
        expect(e.message).toBe('The configuration file path was not provided to \
save the file.');
      }
    });
  });

  describe('addPlugin', () => {
    const originalExistsSync = fs.existsSync;
    const originalReadFileSync = fs.readFileSync;
    const originalParseDocument = yaml.parseDocument;

    afterEach (() => {
      fs.existsSync = originalExistsSync;
      fs.readFileSync = originalReadFileSync;
      yaml.parseDocument = originalParseDocument;
    });

    test(
      'should add plugin locally',
      () => {
        const configPath = path.resolve(outPath, 'ant.yml');
        const config = new Config(configPath);
        config.addPlugin('/foo/bar/myplugin');
        expect(config.config.plugins).toEqual([ '/foo/bar/myplugin' ]);
      }
    );

    test(
      'should add plugin locally',
      () => {
        let configPath = path.resolve(outPath, 'ant.yml');
        const config = new Config(configPath);
        configPath = config.addPlugin('/test/save').save();
        expect(fs.readFileSync(configPath, 'utf-8')).toBe('plugins:\n  - /test/save\n');
      }
    );

    test(
      'should add and keep comments',
      () => {
        const configFileContent = '# Should not be removed\n' +
          'plugins:\n' +
          '  - ./plugins/core\n' +
          '\n' +
          '  # Should not be removed below\n';
        fs.existsSync = jest.fn().mockImplementation(() => true);
        const originalFileReadSync = fs.readFileSync;
        fs.readFileSync = jest.fn().mockImplementation(() => configFileContent);

        const config = new Config(path.resolve(outPath, 'ant.yml'));
        const configPath = config.addPlugin('/foo/bar/myplugin').save();
        const actualConfigFileContent = originalFileReadSync(configPath, 'utf-8');

        // Notice that the empty line is removed when the yaml tree is rendered
        expect(actualConfigFileContent).toBe('# Should not be removed\n' +
        'plugins:\n' +
        '  - ./plugins/core\n' +
        '  - /foo/bar/myplugin\n' +
        '  # Should not be removed below\n');
        expect(yaml.parse(actualConfigFileContent)).toEqual(
          { plugins: [ './plugins/core', '/foo/bar/myplugin' ] }
        );
      }
    );

    test(
      'should consider empty config object when yaml parses null',
      () => {
        const filePath = path.resolve(outPath, 'emptyConfigTest.yml');
        try{
          fs.writeFileSync(filePath, '');
          const config = new Config(filePath);
          config.addPlugin('/foo/bar/myplugin');
          expect(config.config).toEqual({ basePath: outPath, plugins: [ '/foo/bar/myplugin' ] });
        } finally {
          fs.unlinkSync(filePath);
        }
      }
    );

    test(
      'should append the plugin to the existant configuration',
      () => {
        const filePath = path.resolve(outPath, 'existantConfigTest.yml');
        try{
          fs.writeFileSync(filePath, 'plugins:\n  - /foo/bar');
          const config = new Config(filePath);
          config.addPlugin('/myplugin');
          expect(config.config.plugins).toEqual([ '/foo/bar', '/myplugin' ]);
        } finally {
          fs.unlinkSync(filePath);
        }
      }
    );

    test(
      'should do nothing because plugin is already added',
      () => {
        const filePath = path.resolve(outPath, 'alreadyAddedTest.yml');
        try{
          fs.writeFileSync(filePath, 'plugins:\n  - /foo/bar');
          const config = new Config(filePath);
          config.addPlugin('/foo/bar');
          expect(config.config.plugins).toEqual([ '/foo/bar' ]);
        } finally {
          fs.unlinkSync(filePath);
        }
      }
    );

    test(
      'should fail when loading invalid config file',
      () => {
        jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => '/;!@#$%&*()');
        yaml.parseDocument = jest.fn().mockImplementation(() => {
          throw new Error('Mocked error');
        });

        try {
          new Config(path.resolve(outPath, 'ant.yml'));
        } catch (e) {
          expect(e).toBeInstanceOf(AntError);
          expect(e.message).toBe(`Could not load config ${outPath}/ant.yml`);
        }
      }
    );

    describe('global', () => {
      test(
        'should return a global instance',
        () => {
          const globalConfig = Config.Global;
          expect(globalConfig).toBeDefined();
          expect(globalConfig.path).toBe(path.resolve(__dirname, '../../../lib', 'globalConfig.yml'));
          expect(globalConfig.config).toEqual({
            basePath: path.resolve(__dirname, '../../../lib'),
            plugins: [path.resolve(__dirname, '../../../lib/plugins/core')],
            templates: {}
          });
        }
      );
    });
  });

  describe('removePlugin', () => {
    describe('local configuration', () => {
      test(
        'should remove plugin locally',
        async () => {
          const config = new Config(path.resolve(outPath, 'ant.yml'));
          const localConfigFilePath = config.addPlugin('/foo/bar/myplugin').save();
          const configPath = config.removePlugin('/foo/bar/myplugin').save();
          expect(configPath).toBe(localConfigFilePath);
          expect(yaml.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual({ plugins: [] });
        }
      );

      test(
        'should remove plugin locally after reading from file',
        async () => {
          let config = new Config(path.resolve(outPath, 'ant.yml'));
          const localConfigFilePath = config.addPlugin('/reading/from/file').save();

          config = new Config(localConfigFilePath);
          const configPath = config.removePlugin('/reading/from/file').save();
          expect(configPath).toBe(localConfigFilePath);
          expect(yaml.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual({ plugins: [] });
        }
      );

      test(
        'should do nothing because config file is empty',
        async () => {
          const log = jest.spyOn(console, 'log');
          const configFilePath = path.resolve(outPath, 'emptyConfigRemovalTest.yml');
          const config = new Config(configFilePath);

          const json = config.removePlugin('/foo/bar/myplugin').config;
          expect(json.plugins).toBeUndefined();
          expect(log).toBeCalledWith('No plugins was found on configuration file. plugin \
remove command should do nothing');
        }
      );

      test(
        'should do nothing because config file does not have a plugins entry',
        async () => {
          const log = jest.spyOn(console, 'log');
          const configFilePath = path.resolve(outPath, 'noPluginsEntryRemovalTest.yml');
          fs.writeFileSync(configFilePath, 'foo: bar');
          const config = new Config(configFilePath);

          const json = config.removePlugin('/foo/bar/myplugin').config;
          expect(json.plugins).toBeUndefined();
          expect(log).toBeCalledWith('No plugins was found on configuration file. \
plugin remove command should do nothing');
        }
      );

      test(
        'should do nothing because plugins is empty',
        async () => {
          const log = jest.spyOn(console, 'log');
          const configFilePath = path.resolve(outPath, 'emptyPluginsEntryRemovalTest.yml');
          fs.writeFileSync(configFilePath, 'plugins:\n  []');
          const config = new Config(configFilePath);

          const json = config.removePlugin('/foo/bar/myplugin').config;
          expect(json.plugins).toEqual([]);
          expect(log).toHaveBeenCalledWith('Plugin "/foo/bar/myplugin" was \
not found on configuration file. plugin remove command should do nothing');
        }
      );
    });
  });

  describe('addTemplate', () => {
    test('should add template', () => {
      const config = new Config(path.resolve(outPath, 'templateAdd1.yml'));
      expect(config.config.templates).toBeUndefined();

      const templatePath = '/path/to/my/template';
      config.addTemplate('myCategory', 'myTemplate', templatePath);
      expect(config.config.templates).toEqual({
        myCategory: {
          myTemplate: templatePath
        }
      });
      expect(config.toString()).toContain(`templates:
  myCategory:
    myTemplate: /path/to/my/template
`);
    });

    test('should add template on an existing file', () => {
      const configFilePath = path.resolve(outPath, 'templateAdd2.yml');
      fs.writeFileSync(configFilePath, 'templates:\n  fooCategory:\n    barTemplate: /path/to/bar');
      const config = new Config(configFilePath);
      expect(config.config.templates).toEqual({
        fooCategory: {
          barTemplate: '/path/to/bar'
        }
      });

      const templatePath = '/path/to/my/template';
      config.addTemplate('myCategory', 'myTemplate', templatePath);
      expect(config.config.templates).toEqual({
        fooCategory: {
          barTemplate: '/path/to/bar'
        },
        myCategory: {
          myTemplate: templatePath
        }
      });
      expect(config.toString()).toContain(`templates:
  fooCategory:
    barTemplate: /path/to/bar
  myCategory:
    myTemplate: /path/to/my/template
`);
    });

    test('should override a template', () => {
      const configFilePath = path.resolve(outPath, 'templateAdd2.yml');
      fs.writeFileSync(configFilePath, 'templates:\n  myCategory:\n    myTemplate: /path/to/my/template');
      const config = new Config(configFilePath);
      expect(config.config.templates).toEqual({
        myCategory: {
          myTemplate: '/path/to/my/template'
        }
      });
      config.addTemplate('myCategory', 'myTemplate', '/my/other/path');
      expect(config.config.templates).toEqual({
        myCategory: {
          myTemplate: '/my/other/path'
        }
      });
      expect(config.toString()).toContain(`templates:
  myCategory:
    myTemplate: /my/other/path
`);
    });
  });

  describe('removeTemplate', () => {
    const originalConsoleLog = console.log;

    beforeEach(() => {
      console.log = jest.fn();
    });

    afterEach(() => {
      console.log = originalConsoleLog;
    });

    test('should remove template', () => {
      const config = new Config(path.resolve(outPath, 'templateRemoval1.yml'));
      expect(config.config.templates).toBeUndefined();

      const templatePath = '/path/to/my/template';
      config.addTemplate('myCategory', 'myTemplate', templatePath);
      expect(config.config.templates).toEqual({
        myCategory: {
          myTemplate: templatePath
        }
      });

      config.removeTemplate('myCategory', 'myTemplate');
      expect(config.config.templates).toEqual({
        myCategory: {}
      });
      expect(config.toString()).toContain(`templates:
  myCategory:
    {}
`);
    });

    test('should remove template on an existing file', () => {
      const configFilePath = path.resolve(outPath, 'templateRemoval1.yml');
      fs.writeFileSync(configFilePath, 'templates:\n  myCategory:\n    myTemplate: /path/to/my/template');
      const config = new Config(configFilePath);
      expect(config.config.templates).toEqual({
        myCategory: {
          myTemplate: '/path/to/my/template'
        }
      });

      config.removeTemplate('myCategory', 'myTemplate');
      expect(config.config.templates).toEqual({
        myCategory: {}
      });
      expect(config.toString()).toContain(`templates:
  myCategory:
    {}
`);
    });

    test('should do nothing because templates entry was not found', () => {
      const config = new Config(path.resolve(outPath, 'templateRemoval2.yml'));
      expect(config.config.templates).toBeUndefined();

      config.removeTemplate('myCategory', 'myTemplate');
      expect(config.config.templates).toBeUndefined();
      expect(console.log).toHaveBeenCalledWith('"templates" entry was not found on the \
configuration. template remove command should do nothing');
    });

    test('should do nothing because category was not found', () => {
      const configFilePath = path.resolve(outPath, 'templateRemoval3.yml');
      fs.writeFileSync(configFilePath, 'templates:\n  {}');
      const config = new Config(configFilePath);
      expect(config.config.templates).toEqual({});

      config.removeTemplate('myCategory', 'myTemplate');
      expect(config.config.templates).toEqual({});
      expect(console.log).toHaveBeenCalledWith('Template category "myCategory" was not found on the \
configuration. template remove command should do nothing');
    });

    test('should do nothing because template was not found', () => {
      const configFilePath = path.resolve(outPath, 'templateRemoval3.yml');
      fs.writeFileSync(configFilePath, 'templates:\n  myCategory:\n    foo: /bar');
      const config = new Config(configFilePath);
      expect(config.config.templates).toEqual({
        myCategory: {
          foo: '/bar'
        }
      });

      config.removeTemplate('myCategory', 'myTemplate');
      expect(config.config.templates).toEqual({
        myCategory: {
          foo: '/bar'
        }
      });
      expect(console.log).toHaveBeenCalledWith('Template "myTemplate" was not found on the \
configuration. template remove command should do nothing');
    });
  });

  describe('add function', () => {
    test('should add Bin and Lib functions', () => {
      const ant = new Ant();
      const config = new Config({});
      config.addFunction(new BinFunction(ant, 'BinFunc', '/my/bin'));
      let { functions } = config.config;
      expect(functions).toEqual([{
        name: 'BinFunc',
        bin: '/my/bin'
      }]);

      config.addFunction(
        new LibFunction(ant, 'LibFunc', '/myhandler',
          new Runtime(ant, 'MyRuntime', '/my/runtime')
        )
      );
      functions = config.config.functions;
      expect(functions).toEqual([
        {
          name: 'BinFunc',
          bin: '/my/bin'
        },
        {
          name: 'LibFunc',
          handler: '/myhandler',
          runtime: 'MyRuntime'
        }
      ]);
    });

    test('should do nothing if function already exists', () => {
      const ant = new Ant();
      console.log = jest.fn();
      const config = new Config({ functions: [{
        name: 'BinFunc',
        bin: '/my/bin'
      }]});
      config.addFunction(new BinFunction(ant, 'BinFunc', '/my/bin'));
      const { functions } = config.config;
      expect(functions).toEqual([{
        name: 'BinFunc',
        bin: '/my/bin'
      }]);
      expect(console.log.mock.calls.length).toBe(1);
      expect(console.log.mock.calls[0][0]).toBe('Function "BinFunc" already \
found on current config. function add command should do nothing');
    });

    test('should throw error if function is an unsupported type', () => {
      const config = new Config({});
      try {
        config.addFunction({});
      } catch (e) {
        expect(e).toBeInstanceOf(AssertionError);
      }
    });
  });

  describe('remove function', () => {
    test('should remove a function', () => {
      const ant = new Ant();
      const config = new Config({});
      config.addFunction(new BinFunction(ant, 'BinFunc', '/my/bin'));
      config.addFunction(new LibFunction(ant, 'LibFunc', '/myhandler',
        new Runtime(ant, 'MyRuntime', 'my/runtime')
      ));
      config.removeFunction('BinFunc');
      const { functions } = config.config;
      expect(functions).toEqual([{
        name: 'LibFunc',
        handler: '/myhandler',
        runtime: 'MyRuntime'
      }]);
    });

    test('should do nothing if there is no functions installed', () => {
      const config = new Config({});
      config.removeFunction('LibFunc');
      const { functions } = config.config;
      expect(functions).toBeUndefined();
    });

    test('should do nothing if function was not found', () => {
      const ant = new Ant();
      const config = new Config({});
      config.addFunction(new BinFunction(ant, 'BinFunc', '/my/bin'));
      config.removeFunction('LibFunc');
      const { functions } = config.config;
      expect(functions).toEqual([{
        name: 'BinFunc',
        bin: '/my/bin'
      }]);
    });
  });

  describe('static utils', () => {
    describe('ParseConfigTemplates', () => {
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
        const parsedTemplates = Config.ParseConfigTemplates(templatesConfig);
        expect(parsedTemplates.length).toBe(3);

        expect(parsedTemplates[0].category).toEqual('CustomCategory');
        expect(parsedTemplates[0].name).toEqual('CustomTemplate');
        expect(parsedTemplates[0].path).toEqual(customTemplatePath);

        expect(parsedTemplates[1].category).toEqual('CustomCategory');
        expect(parsedTemplates[1].name).toEqual('Foo');
        expect(parsedTemplates[1].path).toEqual(fooPath);

        expect(parsedTemplates[2].category).toEqual('Custom_2');
        expect(parsedTemplates[2].name).toEqual('Bar');
        expect(parsedTemplates[2].path).toEqual(barPath);
      });

      test('should load templates from config with basePath', () => {
        const customTemplatePath = './path/to/my/custom';
        const fooPath = 'path/to/foo';
        const barPath = '../../../path/to/bar';
        const absolutePath = '/absolute/path';
        const templatesConfig = {
          CustomCategory: {
            CustomTemplate: customTemplatePath,
            Foo: fooPath
          },
          Custom_2: {
            Bar: barPath,
            Absolute: absolutePath
          }
        };
        const basePath = '/home/user/myworkspace/';
        const parsedTemplates = Config.ParseConfigTemplates(templatesConfig, basePath);
        expect(parsedTemplates.length).toBe(4);

        expect(parsedTemplates[0].path).toEqual('/home/user/myworkspace/path/to/my/custom');
        expect(parsedTemplates[1].path).toEqual('/home/user/myworkspace/path/to/foo');
        expect(parsedTemplates[2].path).toEqual('/path/to/bar');
        expect(parsedTemplates[3].path).toEqual(absolutePath);
      });

      test('should throw error with invalid templates config', () => {
        expect(() => Config.ParseConfigTemplates('this should\'ve been an object'))
          .toThrowError(
            'Error while loading templates from Ant\'s config file. \
The "template" configuration should be an object!'
          );
      });

      test('should throw error with invalid template category value', () => {
        const templatesConfig = {
          CustomCategory: 'this should\'ve been an object!'
        };
        expect(() => Config.ParseConfigTemplates(templatesConfig))
          .toThrowError(
            'Error while loading templates from Ant\'s config file: \
Template category value is not an object!'
          );
      });
    });

    describe('ParseConfigFunctions', () => {
      test('should parse BinFunctions from config', () => {
        const runtimeController = {
          ant: new Ant()
        };
        const binConfig = {
          name: 'MyBin',
          bin: '/my/bin'
        };
        const binConfig2 = {
          name: 'Foo',
          bin: '/foo/bar'
        };
        const binFunctions = Config.ParseConfigFunctions(
          [ binConfig, binConfig2 ], runtimeController
        );
        expect(binFunctions.length).toBe(2);
        let func = binFunctions[0];
        expect(func).toBeInstanceOf(BinFunction);
        expect(func.name).toBe(binConfig.name);
        expect(func.bin).toBe(binConfig.bin);

        func = binFunctions[1];
        expect(func).toBeInstanceOf(BinFunction);
        expect(func.name).toBe(binConfig2.name);
        expect(func.bin).toBe(binConfig2.bin);
      });

      test('should parse LibFunctions from config', () => {
        const ant = new Ant();
        const libConfig = {
          name: 'MyLib',
          handler: '/my/lib',
          runtime: 'nodejs'
        };
        const libConfig2 = {
          name: 'Foo',
          handler: '/foo/bar',
          runtime: 'python'
        };
        const runtimeController = {
          getRuntime: jest.fn().mockImplementation(
            runtime => new Runtime(ant, runtime, 'foo')
          ),
          ant: new Ant()
        };
        const libFunctions = Config.ParseConfigFunctions(
          [ libConfig, libConfig2 ],
          runtimeController
        );
        expect(libFunctions.length).toBe(2);
        let func = libFunctions[0];
        expect(func).toBeInstanceOf(LibFunction);
        expect(func.name).toBe(libConfig.name);
        expect(func.handler).toBe(libConfig.handler);

        func = libFunctions[1];
        expect(func).toBeInstanceOf(LibFunction);
        expect(func.name).toBe(libConfig2.name);
        expect(func.handler).toBe(libConfig2.handler);

        expect(runtimeController.getRuntime.mock.calls.length).toBe(2);
        expect(runtimeController.getRuntime.mock.calls[0][0]).toBe(libConfig.runtime);
        expect(runtimeController.getRuntime.mock.calls[1][0]).toBe(libConfig2.runtime);
      });

      test('should fail to parse unknown AntFunction type from config', () => {
        const funcConfig = {
          name: 'MyBin',
          foo: 'bar'
        };
        try {
          Config.ParseConfigFunctions(
            [ funcConfig ]
          );
        } catch (e) {
          expect(e).toBeInstanceOf(AntError);
          expect(e.message).toContain('Could not parse AntFunction from configuration file');
        }
      });

      test('should fail to parse LibFunction with unknown runtime', () => {
        const runtimeController = {
          getRuntime: jest.fn().mockImplementation(() => null)
        };
        const funcConfig = {
          name: 'MyLib',
          handler: '/my/handler',
          runtime: 'unknown_runtime'
        };
        try {
          Config.ParseConfigFunctions(
            [ funcConfig ], runtimeController
          );
        } catch (e) {
          expect(e).toBeInstanceOf(AntError);
          expect(e.message).toContain('Could not parse AntFunction from configuration file');
        }
      });
    });
  });
});
