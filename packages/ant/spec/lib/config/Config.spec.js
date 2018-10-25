/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/config/Config.js file.
 */

const { AssertionError } = require('assert');
const process = require('process');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const yaml = require('yaml').default;
const Map = require('yaml/map').default;
const Pair = require('yaml/pair').default;
const Scalar = require('yaml/scalar').default;
const Seq = require('yaml/seq').default;
const { AntError } = require('@back4app/ant-util');
const {
  Config,
  Ant,
  BinFunction,
  Runtime,
  LibFunction
} = require('../../../');

const utilPath = path.resolve(
  __dirname,
  '../../../node_modules/@back4app/ant-util-tests'
);

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
    const configFilePath = path.resolve(outPath, 'ant.yml');
    fsExtra.ensureFileSync(configFilePath);
    const config = new Config(configFilePath);
    expect(config.constructor.name).toEqual('Config');
  });

  test('should create an instance of Config', () => {
    const configFilePath = path.resolve(outPath, 'ant.yml');
    fsExtra.ensureFileSync(configFilePath);
    const config = new Config(configFilePath);
    expect(config).toBeDefined();
  });

  test('should return config file path', () => {
    const filePath = path.resolve(outPath, 'ant.yml');
    fsExtra.ensureFileSync(filePath);
    const config = new Config(filePath);
    expect(config.path).toBe(filePath);
  });

  test('should throw an error due to file not found', () => {
    const filePath = path.resolve(outPath, 'must.not.find.me.yml');
    try {
      new Config(filePath);
    } catch (err) {
      expect(err).toBeInstanceOf(AntError);
      expect(err.message).toBe(`Could not load config at "${filePath}".`);
    }
  });

  test('should ensure a root collection node', () => {
    const config = new Config({});
    const collectionNode = config._ensureRootCollectionNode('foo', Map);
    expect(collectionNode).toBeInstanceOf(Map);
    expect(collectionNode.items.length).toBe(0);
    expect(config._config.contents.items.length).toBe(1);
    expect(config._config.contents.items[0]).toBeInstanceOf(Pair);
    expect(config._config.contents.items[0].key).toBeInstanceOf(Scalar);
    expect(config._config.contents.items[0].key.value).toBe('foo');
    expect(config._config.contents.items[0].value).toBe(collectionNode);
  });

  test('should not modify the root collection node if already exists', () => {
    const config = new Config({});
    config._config.contents.items.push(new Pair(
      new Scalar('foo'),
      new Map()
    ));
    const collectionNode = config._ensureRootCollectionNode('foo', Map);
    expect(collectionNode).toBeInstanceOf(Map);
    expect(collectionNode.items.length).toBe(0);
    expect(config._config.contents.items.length).toBe(1);
    expect(config._config.contents.items[0]).toBeInstanceOf(Pair);
    expect(config._config.contents.items[0].key).toBeInstanceOf(Scalar);
    expect(config._config.contents.items[0].key.value).toBe('foo');
    expect(config._config.contents.items[0].value).toBe(collectionNode);
  });

  test('should remove an unexpected root node', () => {
    const config = new Config({});
    config._config.contents.items.push(new Pair(
      new Scalar('foo'),
      new Scalar('this/should/be/a/collection')
    ));
    const collectionNode = config._ensureRootCollectionNode('foo', Map);
    expect(collectionNode).toBeInstanceOf(Map);
    expect(collectionNode.items.length).toBe(0);
    expect(config._config.contents.items.length).toBe(1);
    expect(config._config.contents.items[0]).toBeInstanceOf(Pair);
    expect(config._config.contents.items[0].key).toBeInstanceOf(Scalar);
    expect(config._config.contents.items[0].key.value).toBe('foo');
    expect(config._config.contents.items[0].value).toBe(collectionNode);
  });

  test('should find a root collection node by key', () => {
    const config = new Config({});
    const fooNode = new Pair(
      new Scalar('foo'),
      new Seq()
    );
    const barNode = new Pair(
      new Scalar('bar'),
      new Map()
    );
    const loremNode = new Pair(
      new Scalar('lorem'),
      new Pair()
    );
    config._config.contents.items.push(fooNode);
    config._config.contents.items.push(barNode);
    config._config.contents.items.push(loremNode);
    expect(config._findRootCollectionNode('foo', Seq)).toBe(fooNode.value);
    expect(config._findRootCollectionNode('bar', Map)).toBe(barNode.value);
    expect(config._findRootCollectionNode('lorem', Map)).toBe(null);
  });

  test('should filter yaml document node by key', () => {
    const config = new Config({});
    const fooNode = new Pair(
      new Scalar('foo'),
      new Scalar('/my/foo')
    );
    const barNode = new Pair(
      new Scalar('bar'),
      new Scalar('/my/bar')
    );
    const loremNode = new Pair(
      new Scalar('lorem'),
      new Scalar('/lorem/ipsum')
    );
    const map = new Map();
    map.items.push(fooNode);
    map.items.push(barNode);
    map.items.push(loremNode);
    const filtered = config._filterNodeFromCollectionByKey(map, 'bar');
    expect(filtered).toBe(true);
    expect(map.items.length).toBe(2);
    expect(map.items.includes(fooNode));
    expect(map.items.includes(loremNode));
  });

  test('should create attributes Map', () => {
    const config = new Config({});
    const map = config._createAttributeMap({
      foo: 'a',
      bar: 'b',
      abc: 1,
      err: undefined // should be ignored
    });
    expect(map).toBeInstanceOf(Map);
    expect(map.items.length).toBe(3);
    expect(map.items[0].key).toBeInstanceOf(Scalar);
    expect(map.items[0].key.value).toBe('foo');
    expect(map.items[0].value).toBeInstanceOf(Scalar);
    expect(map.items[0].value.value).toBe('a');

    expect(map.items[1].key).toBeInstanceOf(Scalar);
    expect(map.items[1].key.value).toBe('bar');
    expect(map.items[1].value).toBeInstanceOf(Scalar);
    expect(map.items[1].value.value).toBe('b');

    expect(map.items[2].key).toBeInstanceOf(Scalar);
    expect(map.items[2].key.value).toBe('abc');
    expect(map.items[2].value).toBeInstanceOf(Scalar);
    expect(map.items[2].value.value).toBe(1);
  });

  test('should return config JSON representation', () => {
    const filePath = path.resolve(outPath, 'antJSONtest.yml');
    try{
      fs.writeFileSync(filePath, 'basePath: $GLOBAL\n\
plugins:\n  - $GLOBAL/@back4app/ant-util-tests/plugins/FooPlugin\n\
templates:\n  MyCategory:\n    MyTemplate: /my/template/path\n');
      const config = new Config(filePath);
      expect(config.config).toEqual({
        basePath: path.resolve(__dirname, '../../../'),
        plugins: [ fs.realpathSync(path.resolve(utilPath, 'plugins/FooPlugin.js')) ],
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
        const config = new Config({});
        config.addPlugin('/foo/bar/myplugin');
        expect(config.config.plugins).toEqual([ '/foo/bar/myplugin' ]);
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

    test(
      'should fail when loading invalid config file v2',
      () => {
        jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => '/;!@#$%&*()');
        yaml.parseDocument = jest.fn().mockImplementation(() => {
          return { toJSON: () => 'some error' };
        });

        try {
          new Config(path.resolve(outPath, 'ant.yml'));
        } catch (e) {
          expect(e).toBeInstanceOf(AntError);
          expect(e.message).toEqual(
            expect.stringContaining('Could not load config')
          );
        }
      }
    );

    describe('global', () => {
      test(
        'should return a global instance',
        () => {
          const globalConfig = Config.Global;
          expect(globalConfig).toBeDefined();
          expect(globalConfig.path).toEqual(path.resolve(__dirname, '../../../lib', 'globalConfig.yml'));
          expect(globalConfig.config).toEqual({
            basePath: path.resolve(__dirname, '../../../lib'),
            plugins: [require.resolve('@back4app/ant-core')],
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
          const configFilePath = path.resolve(outPath, 'ant.yml');
          fsExtra.ensureFileSync(configFilePath);
          const config = new Config(configFilePath);
          const localConfigFilePath = config.addPlugin('/foo/bar/myplugin').save();
          const configPath = config.removePlugin('/foo/bar/myplugin').save();
          expect(configPath).toBe(localConfigFilePath);
          expect(yaml.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual({ plugins: [] });
        }
      );

      test(
        'should remove plugin locally after reading from file',
        async () => {
          const configFilePath = path.resolve(outPath, 'ant.yml');
          fsExtra.ensureFileSync(configFilePath);
          let config = new Config(configFilePath);
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
          fsExtra.ensureFileSync(configFilePath);
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
      const configFilePath = path.resolve(outPath, 'templateAdd1.yml');
      fsExtra.ensureFileSync(configFilePath);
      const config = new Config(configFilePath);
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
      const configFilePath = path.resolve(outPath, 'templateRemoval1.yml');
      fsExtra.ensureFileSync(configFilePath);
      const config = new Config(configFilePath);
      expect(config.config.templates).toBeUndefined();

      const templatePath = '/path/to/my/template';
      config.addTemplate('myCategory', 'myTemplate', templatePath);
      expect(config.config.templates).toEqual({
        myCategory: {
          myTemplate: templatePath
        }
      });

      config.removeTemplate('myCategory', 'myTemplate');
      expect(config.config.templates).not.toBeDefined();
    });

    test('should remove template on an existing file', () => {
      const configFilePath = path.resolve(outPath, 'templateRemoval2.yml');
      fsExtra.ensureFileSync(configFilePath);
      fs.writeFileSync(configFilePath, 'templates:\n  myCategory:\n    myTemplate: /path/to/my/template');
      const config = new Config(configFilePath);
      expect(config.config.templates).toEqual({
        myCategory: {
          myTemplate: '/path/to/my/template'
        }
      });

      config.removeTemplate('myCategory', 'myTemplate');
      expect(config.config.templates).not.toBeDefined();
    });

    test('should do nothing because templates entry was not found', () => {
      const configFilePath = path.resolve(outPath, 'templateRemoval3.yml');
      fsExtra.ensureFileSync(configFilePath);
      const config = new Config(configFilePath);
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
      expect(functions).toEqual({
        BinFunc: {
          bin: '/my/bin'
        }
      });

      config.addFunction(
        new LibFunction(ant, 'LibFunc', '/myhandler',
          new Runtime(ant, 'MyRuntime', '/my/runtime', [], undefined, '1')
        )
      );
      functions = config.config.functions;
      expect(functions).toEqual({
        BinFunc: {
          bin: '/my/bin'
        },
        LibFunc: {
          handler: '/myhandler',
          runtime: 'MyRuntime'
        }
      });

      config.addFunction(
        new LibFunction(ant, 'LibFuncVersionDefined', '/myhandler',
          new Runtime(ant, 'MyRuntime', '/my/runtime', [], undefined, '1')
        ), true
      );
      functions = config.config.functions;
      expect(functions).toEqual({
        BinFunc: {
          bin: '/my/bin'
        },
        LibFunc: {
          handler: '/myhandler',
          runtime: 'MyRuntime'
        },
        LibFuncVersionDefined: {
          handler: '/myhandler',
          runtime: 'MyRuntime 1'
        }
      });
    });

    test('should override if function already exists', () => {
      const ant = new Ant();
      console.log = jest.fn();
      const config = new Config({
        functions: {
          BinFunc: {
            bin: '/my/bin'
          }
        }
      });
      config.addFunction(new BinFunction(ant, 'BinFunc', '/alternative/bin'));
      const { functions } = config.config;
      expect(functions).toEqual({
        BinFunc: {
          bin: '/alternative/bin'
        }
      });
      expect(console.log.mock.calls.length).toBe(2);
      expect(console.log.mock.calls[0][0]).toBe('Function "BinFunc" already \
found on the configuration file. function add command will OVERRIDE the current function');
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
        new Runtime(ant, 'MyRuntime', 'my/runtime', [], undefined, '1')
      ));
      config.removeFunction('BinFunc');
      const { functions } = config.config;
      expect(functions).toEqual({
        LibFunc: {
          handler: '/myhandler',
          runtime: 'MyRuntime'
        }
      });
    });

    test('should remove a function and remove functions node', () => {
      const ant = new Ant();
      const config = new Config({});
      config.addFunction(new BinFunction(ant, 'BinFunc', '/my/bin'));
      config.removeFunction('BinFunc');
      expect(config.config.functions).not.toBeDefined();
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
      expect(functions).toEqual({
        BinFunc: {
          bin: '/my/bin'
        }
      });
    });
  });

  describe('add runtime', () => {
    test('should add a runtime', () => {
      const ant = new Ant();
      const config = new Config({});
      const runtime = new Runtime(ant, 'runtime', '/my/bin', [ 'js' ], undefined, '1');
      expect(config.addRuntime(runtime)).toBe(config);
      expect(config.config.runtimes).toEqual({
        'runtime 1': {
          bin: '/my/bin',
          extensions: ['js']
        }
      }
      );
    });

    test('should override a runtime', () => {
      console.log = jest.fn();
      const ant = new Ant();
      const config = new Config({});
      const runtime = new Runtime(ant, 'runtime', '/my/bin', [ 'js' ], undefined, '1');
      config.addRuntime(runtime);
      config.addRuntime(new Runtime(ant, 'runtime', '/alternative/bin', [ 'py' ], undefined, '1'));
      expect(console.log).toHaveBeenCalledWith('Runtime "runtime 1" already \
found on the configuration file. runtime add command will OVERRIDE the current runtime');
      expect(config.config.runtimes).toEqual({
        'runtime 1': {
          bin: '/alternative/bin',
          extensions: [ 'py' ]
        }
      });
    });
  });

  describe('remove runtime', () => {
    test('should remove a runtime', () => {
      const ant = new Ant();
      const config = new Config({});
      const runtime = new Runtime(ant, 'runtime', '/my/bin', [ 'js' ], undefined, '1');
      config.addRuntime(runtime);
      config.removeRuntime('runtime', '1');
      expect(config.config.runtimes).not.toBeDefined();
    });

    test('should do nothing because "runtimes" does not exists', () => {
      console.log = jest.fn();
      const config = new Config({});
      config.removeRuntime('runtime', '1');
      expect(console.log).toHaveBeenCalledWith('No "runtimes" was found \
on configuration file. runtime remove command should do nothing');
    });

    test('should do nothing because runtime was not found', () => {
      console.log = jest.fn();
      const ant = new Ant();
      const config = new Config({});
      const runtime = new Runtime(ant, 'runtime', '/my/bin', [ 'js' ], undefined, '1');
      config.addRuntime(runtime);
      config.removeRuntime('foo', '1');
      expect(console.log).toHaveBeenCalledWith('Runtime "foo 1" was not \
found on configuration file. runtime remove command should do nothing');
    });
  });

  describe('Config file cleaning', () => {
    const configPath = path.resolve(outPath, 'ant.yml');

    beforeEach(() => {
      fsExtra.ensureFileSync(configPath);
    });

    test('should not clean a pair with scalar value', () => {
      fs.writeFileSync(configPath, 'basePath: 123');
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'basePath');
      config._cleanRootNode(node);
      expect(config.toString()).toBe('basePath: 123\n');
    });

    test('should not clean a list with scalar value', () => {
      fs.writeFileSync(configPath, `plugins:
  - myPlugin`);
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'plugins');
      config._cleanRootNode(node);
      expect(config.toString()).toBe(`plugins:
  - myPlugin
`);
    });

    test('should clean an array with no value', () => {
      fs.writeFileSync(configPath, `plugins:
  []`);
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'plugins');
      config._cleanRootNode(node);
      expect(config.toString()).toBe('{}\n');
    });

    test('should clean templates', () => {
      fs.writeFileSync(configPath, `templates:
  {}`);
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'templates');
      config._cleanRootNode(node);
      expect(config.toString()).toBe('{}\n');
    });

    test('should clean templates with empty category', () => {
      fs.writeFileSync(configPath, `templates:
  myCategory:
    {}
  myOtherCategory:
    {}`);
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'templates');
      config._cleanRootNode(node);
      expect(config.toString()).toBe('{}\n');
    });

    test('should clean templates with empty category and non empty category', () => {
      fs.writeFileSync(configPath, `templates:
  myCategory:
    {}
  myOtherCategory:
    myTemplate: /foo/bar`);
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'templates');
      config._cleanRootNode(node);
      expect(config.toString()).toBe(`templates:
  myOtherCategory:
    myTemplate: /foo/bar
`);
    });

    test('should convert plugin entry into scalar', () => {
      fs.writeFileSync(configPath, `plugins:
  - myPlugin:
      {}`);
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'plugins');
      config._cleanPluginsNode(node);
      expect(config.toString()).toBe(`plugins:
  - myPlugin
`);
    });

    test('should clean a plugin directives', () => {
      fs.writeFileSync(configPath, `plugins:
  - myPlugin:
      basePath: ./
      directives:
        {}`);
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'plugins');
      config._cleanPluginsNode(node);
      expect(config.toString()).toBe(`plugins:
  - myPlugin:
      basePath: ./
`);
    });

    test('should clean a plugin directives and other empty property', () => {
      fs.writeFileSync(configPath, `plugins:
  - myPlugin:
      otherEmpty:
        {}
      directives:
        {}`);
      const config = new Config(configPath);
      const node = config._config.contents.items.find(entry => entry.key.value === 'plugins');
      config._cleanPluginsNode(node);
      expect(config.toString()).toBe(`plugins:
  - myPlugin
`);
    });
  });

  describe('static utils', () => {
    describe('GetLocalConfigPath', () => {
      afterAll(() => {
        jest.restoreAllMocks();
      });

      test('should return local config path', () => {
        const cwdPath = '/my/path';
        const cwdMock = jest.spyOn(process, 'cwd').mockImplementation(() => {
          return cwdPath;
        });
        const result = Config.GetLocalConfigPath();
        expect(cwdMock).toHaveBeenCalledWith();
        expect(result).toBe(`${cwdPath}/ant.yml`);
      });
    });

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
        const functions = {
          MyBin: {
            bin: '/my/bin'
          },
          Foo: {
            bin: '/foo/bar'
          }
        };
        const binFunctions = Config.ParseConfigFunctions(
          functions, runtimeController
        );
        expect(binFunctions.length).toBe(2);
        let func = binFunctions[0];
        expect(func).toBeInstanceOf(BinFunction);
        expect(func.name).toBe('MyBin');
        expect(func.bin).toBe(functions.MyBin.bin);

        func = binFunctions[1];
        expect(func).toBeInstanceOf(BinFunction);
        expect(func.name).toBe('Foo');
        expect(func.bin).toBe(functions.Foo.bin);
      });

      test('should parse LibFunctions from config', () => {
        const ant = new Ant();
        const functions = {
          MyLib: {
            handler: '/my/lib',
            runtime: 'nodejs'
          },
          Foo: {
            handler: '/foo/bar',
            runtime: 'python'
          }
        };
        const runtimeController = {
          getRuntime: jest.fn().mockImplementation(
            runtime => new Runtime(ant, runtime, 'foo', [], undefined, '1')
          ),
          ant: new Ant()
        };
        const libFunctions = Config.ParseConfigFunctions(
          functions, runtimeController
        );
        expect(libFunctions.length).toBe(2);
        let func = libFunctions[0];
        expect(func).toBeInstanceOf(LibFunction);
        expect(func.name).toBe('MyLib');
        expect(func.handler).toBe(functions.MyLib.handler);

        func = libFunctions[1];
        expect(func).toBeInstanceOf(LibFunction);
        expect(func.name).toBe('Foo');
        expect(func.handler).toBe(functions.Foo.handler);

        expect(runtimeController.getRuntime.mock.calls.length).toBe(2);
        expect(runtimeController.getRuntime.mock.calls[0][0]).toBe(functions.MyLib.runtime);
        expect(runtimeController.getRuntime.mock.calls[1][0]).toBe(functions.Foo.runtime);
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

    describe('ParseConfigRuntimes', () => {
      test('should parse runtimes from config', () => {
        const runtimes = {
          'Runtime 1': {
            bin: '/my/runtime',
            extensions: ['py']
          },
          'Node 2': {
            bin: '/node',
            extensions: ['js']
          },
        };
        const ant = new Ant();
        const results = Config.ParseConfigRuntimes(runtimes, ant);
        expect(results.length).toBe(2);

        expect(results[0]).toBeInstanceOf(Runtime);
        expect(results[0].name).toBe('Runtime');
        expect(results[0].version).toBe('1');
        expect(results[0].bin).toBe(runtimes['Runtime 1'].bin);
        expect(results[0].extensions).toBe(runtimes['Runtime 1'].extensions);

        expect(results[1]).toBeInstanceOf(Runtime);
        expect(results[1].name).toBe('Node');
        expect(results[1].version).toBe('2');
        expect(results[1].bin).toBe(runtimes['Node 2'].bin);
        expect(results[1].extensions).toBe(runtimes['Node 2'].extensions);
      });
    });

    describe('ParseConfigDefaultRuntime', () => {
      test('should parse default runtime from config', () => {
        const myDefaultRuntime = 'myDefaultRuntime';
        const runtimeStub = new Runtime(
          new Ant(), 'runtimeStub', '/my/runtime/stub', ['foo', 'bar'], undefined, '1'
        );
        const getRuntimeMock = jest.fn(name => {
          expect(name).toBe(myDefaultRuntime);
          return runtimeStub;
        });
        const runtimeControllerMock = {
          getRuntime: getRuntimeMock
        };
        const result = Config.ParseConfigDefaultRuntime(myDefaultRuntime, runtimeControllerMock);
        expect(result).toEqual(runtimeStub);
      });

      test('should return null if default runtime name was not provided', () => {
        expect(Config.ParseConfigDefaultRuntime(null)).toBe(null);
      });

      test('should throw error if default runtime was not found', () => {
        const runtimeControllerMock = {
          getRuntime: () => null
        };
        try {
          Config.ParseConfigDefaultRuntime('foo', runtimeControllerMock);
          throw new Error('should have thrown an error');
        } catch (e) {
          expect(e).toBeInstanceOf(AntError);
          expect(e.message).toBe('Could not set default runtime: Runtime "foo" was not found');
        }
      });
    });
  });
});
