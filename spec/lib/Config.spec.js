/* eslint-disable no-console */
/**
 * @fileoverview Tests for lib/Config.js file.
 */
const AntError = require('../../lib/util/AntError');
const Config = require('../../lib/Config');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const process = require('process');
const yaml = require('yaml').default;

describe('lib/Config.js', () => {
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
      fs.writeFileSync(filePath, 'plugins:\n  - foo/bar\n');
      const config = new Config(filePath);
      expect(config.config).toEqual({ plugins: [ 'foo/bar' ]});
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('should return config empty JSON representation', () => {
    const filePath = path.resolve(outPath, 'antJSONtest.yml');
    try{
      fs.writeFileSync(filePath, '');
      const config = new Config(filePath);
      expect(config.config).toEqual({});
    } finally {
      fs.unlinkSync(filePath);
    }
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
        expect(config.config).toEqual({ plugins: [ '/foo/bar/myplugin' ] });
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
          expect(config.config).toEqual({ plugins: [ '/foo/bar/myplugin' ] });
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
          fs.writeFileSync(filePath, 'plugins:\n  - foo/bar');
          const config = new Config(filePath);
          config.addPlugin('myplugin');
          expect(config.config).toEqual({ plugins: [ 'foo/bar', 'myplugin' ] });
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
          fs.writeFileSync(filePath, 'plugins:\n  - foo/bar');
          const config = new Config(filePath);
          config.addPlugin('foo/bar');
          expect(config.config).toEqual({ plugins: [ 'foo/bar' ] });
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
          const globalConfig = Config.GLOBAL;
          expect(globalConfig).toBeDefined();
          expect(globalConfig.path).toBe(path.resolve(__dirname, '../../lib', 'globalConfig.yml'));
          expect(globalConfig.config).toEqual({ plugins: ['./plugins/core'], templates: {} });
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
          expect(json).toEqual({});
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
          expect(json).toEqual({ foo: 'bar' });
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
          expect(json).toEqual({ plugins: [] });
          expect(log).toHaveBeenCalledWith('Plugin "/foo/bar/myplugin" was \
not found on configuration file. plugin remove command should do nothing');
        }
      );
    });
  });
});
