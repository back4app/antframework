/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/plugins/core/lib/Core.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const { makeExecutableSchema } = require('graphql-tools');
const AntCli = require('../../../../../lib/cli/AntCli');
const Ant = require('../../../../../lib/Ant');
const Plugin = require('../../../../../lib/plugins/Plugin');
const Template = require('../../../../../lib/templates/Template');
const Core = require('../../../../../lib/plugins/core/lib/Core');
const nodeFs = require('fs');
const logger = require('../../../../../lib/util/logger');
const yargsHelper = require('../../../../../lib/util/yargsHelper');

const ant = new Ant();

describe('lib/plugins/core/lib/Core.js', () => {
  const originalCwd = process.cwd();
  const outPath = path.resolve(
    __dirname,
    '../../../../support/out/lib/plugins/core/lib/Core.js',
    'out' + Math.floor(Math.random() * 1000)
  );

  beforeEach(() => {
    try {
      fs.removeSync(outPath);
    } finally {
      try {
        fs.ensureDirSync(outPath);
      } finally {
        process.chdir(outPath);
      }
    }
  });

  afterEach(() => {
    try {
      fs.removeSync(outPath);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('should export "Core" class extending "Plugin" class', () => {
    const core = new Core(ant);
    expect(core.constructor.name).toEqual('Core');
    expect(core).toBeInstanceOf(Plugin);
    expect(core.name).toEqual('Core');
  });

  describe('Core.templates', () => {
    test('should be readonly and return the Default template', () => {
      const core = new Core(ant);
      expect(core.templates).toEqual(expect.any(Array));
      expect(core.templates).toHaveLength(1);
      expect(core.templates[0]).toEqual(expect.any(Template));
      expect(core.templates[0].category).toEqual('Service');
      expect(core.templates[0].name).toEqual('Default');
      core.templates = [];
      expect(core.templates).toEqual(expect.any(Array));
      expect(core.templates).toHaveLength(1);
      expect(core.templates[0]).toEqual(expect.any(Template));
      expect(core.templates[0].category).toEqual('Service');
      expect(core.templates[0].name).toEqual('Default');
    });

    describe('Service templates', () => {
      describe('Default template', () => {
        test('Should be rendered by createService', async () => {
          const outPath = await (new Core(new Ant())).createService(
            'MyService',
            'Default'
          );
          expect(fs.readdirSync(outPath)).toEqual(['ant.yml', 'model.graphql']);
          expect(
            yaml.safeLoad(
              fs.readFileSync(path.resolve(outPath, 'ant.yml'), 'utf8')
            ).service
          ).toEqual('MyService');
          makeExecutableSchema({
            typeDefs: fs.readFileSync(
              path.resolve(outPath, 'model.graphql'),
              'utf8'
            )
          });
        });
      });
    });
  });

  describe('Core.loadYargsSettings', () => {
    const originalArgv = process.argv;
    const originalLog = console.log;
    const originalError = console.error;
    const originalExit = process.exit;

    afterEach(() => {
      process.argv = originalArgv;
      console.log = originalLog;
      console.error = originalError;
      process.exit = originalExit;
    });

    describe('create command', () => {
      test('should load "create" command', (done) => {
        console.log = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Service "MyService" successfully created')
          );
          expect(code).toEqual(0);
          done();
        });
        (new AntCli())._yargs.parse('create MyService');
      });

      test('should have "template" option', (done) => {
        console.log = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Service "MyService" successfully created')
          );
          expect(code).toEqual(0);
          done();
        });
        (new AntCli())._yargs.parse('create MyService --template Default');
      });

      test('should have "t" option alias', (done) => {
        console.log = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Service "MyService" successfully created')
          );
          expect(code).toEqual(0);
          done();
        });
        (new AntCli())._yargs.parse('create MyService -t Default');
      });

      test('should show friendly errors', (done) => {
        console.error = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
              'Could not create service: template "NotExistent" was not found'
            )
          );
          expect(code).toEqual(1);
          done();
        });
        (new AntCli())._yargs.parse('create MyService --template NotExistent');
      });

      test('should show friendly error when service name not passed', (done) => {
        process.argv.push('create');
        console.error = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
              'Create command requires service argument'
            )
          );
          expect(code).toEqual(1);
          done();
        });
        const core = new Core(ant);
        core._yargsFailed(
          'Not enough non-option arguments',
          {
            handleErrorMessage: (msg, err, command) =>
              (new AntCli())._handleErrorMessage(msg, err, command)
          }
        );
      });

      test('should show friendly error when more passed arguments', (done) => {
        process.argv.push('create');
        console.error = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
              'Create command only accepts 1 argument'
            )
          );
          expect(code).toEqual(1);
          done();
        });
        const core = new Core(ant);
        core._yargsFailed(
          'Unknown argument: templatename',
          {
            handleErrorMessage: (msg, err, command) =>
              (new AntCli())._handleErrorMessage(msg, err, command)
          }
        );
      });

      test('should show friendly error when template name not passed', (done) => {
        process.argv.push('create');
        console.error = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
              'Template option requires name argument'
            )
          );
          expect(code).toEqual(1);
          done();
        });
        const core = new Core(ant);
        core._yargsFailed(
          'Not enough arguments following: template',
          {
            handleErrorMessage: (msg, err, command) =>
              (new AntCli())._handleErrorMessage(msg, err, command)
          }
        );
      });
    });

    describe('plugin command', () => {
      describe('plugin install command', () => {
        test('should show friendly error when plugin was not passed', (done) => {
          process.argv = ['plugin', 'install'];
          console.error = jest.fn();
          process.exit = jest.fn((code) => {
            expect(console.error).toHaveBeenCalledWith(
              expect.stringContaining('Plugin install command requires plugin argument')
            );
            expect(code).toEqual(1);
            done();
          });
          const core = new Core(ant);
          core._yargsFailed('Not enough non-option arguments');
        });
      });

      describe('plugin remove command', () => {
        test('should show friendly error when plugin was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['plugin', 'remove'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Plugin remove command requires plugin argument', null, 'plugin remove'
            );
            expect(code).toEqual(1);
            done();
          });
          new Core(ant)._yargsFailed('Not enough non-option arguments');
        });

        test('should not show friendly error when error is unknown', () => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['plugin', 'remove'];
          new Core(ant)._yargsFailed('Unknown error');
          expect(handleErrorMessage).not.toHaveBeenCalled();
        });
      });
    });

    test('should not change the error message for other cases', () => {
      process.argv.push('create');
      console.error = jest.fn();
      process.exit = jest.fn();

      const core = new Core(ant);
      core._yargsFailed(
        'Foo message',
        {
          parsed: {
            argv: {
              '$0': 'ant'
            }
          }
        }
      );

      expect(console.error).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
    });

    test('should show error stack in verbose mode', (done) => {
      process.argv.push('-v');
      console.error = jest.fn();
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Error stack:'
          )
        );
        expect(code).toEqual(1);
        done();
      });
      (new AntCli())._yargs.parse('create -v MyService --template NotExistent');
    });

    test('should do nothing', (done) => {
      process.argv.push('create');
      console.error = jest.fn();
      process.exit = jest.fn();

      const core = new Core(ant);
      core._yargsFailed('');

      expect(console.error).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
      done();
    });

    test('should do nothing when unexpected error is thrown on plugin install', (done) => {
      process.argv = ['plugin', 'install'];
      console.error = jest.fn();
      process.exit = jest.fn();

      const core = new Core(ant);
      core._yargsFailed('An unexpected error');

      expect(console.error).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
      done();
    });
  });

  describe('Core.createService', () => {
    test(
      'should be async and render template with sanitized path',
      async () => {
        const core = new Core(ant);
        const originalRender = core.templates[0].render;
        core.templates[0].render = jest.fn();
        const createServiceReturn = core.createService('a-b!c$d');
        expect(createServiceReturn).toBeInstanceOf(Promise);
        await createServiceReturn;
        expect(core.templates[0].render).toHaveBeenCalledWith(
          expect.stringContaining('a-b-c-d'),
          {service: 'a-b!c$d'}
        );
        core.templates[0].render = originalRender;
      }
    );

    test('should fail if name and template params are not String', async () => {
      expect.hasAssertions();
      const core = new Core(ant);
      await expect(core.createService()).rejects.toThrow(
        'Could not create service: param "name" is required'
      );
      await expect(core.createService('')).rejects.toThrow(
        'Could not create service: param "name" is required'
      );
      await expect(core.createService({})).rejects.toThrow(
        'Could not create service: param "name" should be String'
      );
      await expect(core.createService('MyService', {})).rejects.toThrow(
        'Could not create service: param "template" should be String'
      );
    });

    test('should fail if a folder with the service name already exists', () => {
      expect.hasAssertions();
      const core = new Core(ant);
      fs.mkdirSync('MyService');
      expect(core.createService('MyService')).rejects.toThrow(
        'Could not render template: path'
      );
      fs.rmdirSync('MyService');
    });
  });

  describe('Core.pluginInstall', () => {
    const originalExistsSync = nodeFs.existsSync;
    const originalReadFileSync = nodeFs.readFileSync;
    const originalSafeLoad = yaml.safeLoad;

    afterEach (() => {
      nodeFs.existsSync = originalExistsSync;
      nodeFs.readFileSync = originalReadFileSync;
      yaml.safeLoad = originalSafeLoad;
    });

    test(
      'should be async and install plugin locally',
      async () => {
        const core = new Core(ant);
        const configPath = await core.installPlugin('/foo/bar/myplugin');
        expect(yaml.safeLoad(fs.readFileSync(configPath))).toEqual({ plugins: [ '/foo/bar/myplugin' ] });
      }
    );

    test(
      'should consider empty config object when yaml loads null',
      async () => {
        nodeFs.existsSync = () => true;
        nodeFs.readFileSync = () => '';
        yaml.safeLoad = () => null;

        const core = new Core(ant);
        const configPath = await core.installPlugin('/foo/bar/myplugin');
        expect(originalSafeLoad(fs.readFileSync(configPath))).toEqual({ plugins: [ '/foo/bar/myplugin' ] });
      }
    );

    test(
      'should append the plugin to the existant configuration',
      async () => {
        nodeFs.existsSync = () => true;
        nodeFs.readFileSync = () => 'plugins:\n - /existant/plugin';

        const core = new Core(ant);
        const configPath = await core.installPlugin('/foo/bar/myplugin');
        expect(yaml.safeLoad(fs.readFileSync(configPath))).toEqual({ plugins: [ '/existant/plugin', '/foo/bar/myplugin' ] });
      }
    );

    test(
      'should do nothing because plugin is already installed',
      async () => {
        nodeFs.existsSync = () => true;
        nodeFs.readFileSync = () => 'plugins:\n - /foo/bar/myplugin';

        const core = new Core(ant);
        const configPath = await core.installPlugin('/foo/bar/myplugin');
        expect(configPath).toBe(null);
      }
    );

    test(
      'should fail when loading invalid config file',
      async () => {
        nodeFs.existsSync = () => true;
        yaml.safeLoad = () => {
          throw new Error('Mocked error');
        };

        const core = new Core(ant);
        await expect(core.installPlugin('/foo/bar/myplugin')).rejects
          .toThrowError(`Could not load config ${outPath}/ant.yml`);
      }
    );

    describe('global', () => {
      const originalReadFileSync = nodeFs.readFileSync;
      const originalWriteFileSync = nodeFs.writeFileSync;
      const originalSafeLoad = yaml.safeLoad;

      afterEach (() => {
        nodeFs.readFileSync = originalReadFileSync;
        nodeFs.writeFileSync = originalWriteFileSync;
        yaml.safeLoad = originalSafeLoad;
      });

      test(
        'should be async and install plugin globally',
        async () => {
          const plugin = '/foo/bar/myplugin';
          nodeFs.readFileSync = () => '';
          nodeFs.writeFileSync = (path, data) => {
            expect(path).toBe(core._getGlobalConfigPath());
            expect(data).toBe(`plugins:\n  - ${plugin}\n`);
          };

          const core = new Core(ant);
          await core.installPlugin(plugin, true);
        }
      );

      test(
        'should fail when loading invalid global config file',
        async () => {
          yaml.safeLoad = () => {
            throw new Error('Mocked error');
          };

          const core = new Core(ant);
          await core.installPlugin('/foo/bar/myplugin', true).catch(
            e => expect(e.message.startsWith('Could not load global config')).toBeTruthy()
          );
        }
      );
    });
  });

  describe('Core.pluginRemove', () => {
    describe('local configuration', () => {
      test(
        'should be async and remove plugin locally',
        async () => {
          const core = new Core(ant);
          const localConfigFilePath = await core.installPlugin('/foo/bar/myplugin', false);

          const configPath = await core.removePlugin('/foo/bar/myplugin');
          expect(configPath).toBe(localConfigFilePath);
          expect(yaml.safeLoad(fs.readFileSync(configPath))).toEqual({ plugins: [] });
        }
      );

      test(
        'should do nothing because config file does not exist',
        async () => {
          const core = new Core(ant);
          const configPath = await core.removePlugin('/foo/bar/myplugin');
          expect(configPath).toBe(null);
        }
      );

      test(
        'should do nothing because config file is empty',
        async () => {
          const core = new Core(ant);
          const configFilePath = core._getLocalConfigPath();
          fs.writeFileSync(configFilePath, '');

          const configPath = await core.removePlugin('/foo/bar/myplugin');
          expect(configPath).toBe(null);
        }
      );

      test(
        'should do nothing because plugins is empty',
        async () => {
          const core = new Core(ant);
          const configFilePath = core._getLocalConfigPath();
          fs.writeFileSync(configFilePath, yaml.safeDump({ plugins: []}));

          const configPath = await core.removePlugin('/foo/bar/myplugin');
          expect(configPath).toBe(null);
        }
      );
    });
    describe('global configuration', () => {
      test(
        'should be async and remove plugin globally',
        async () => {
          const core = new Core(ant);
          const mockedGlobalPath = path.resolve(outPath, 'global');
          fs.writeFileSync(mockedGlobalPath, yaml.safeDump({ plugins: [] }));
          core._getGlobalConfigPath = () => mockedGlobalPath;
          const globalConfigFilePath = await core.installPlugin('/foo/bar/myplugin', true);
          const configPath = await core.removePlugin('/foo/bar/myplugin', true);
          expect(configPath).toBe(globalConfigFilePath);
          expect(yaml.safeLoad(fs.readFileSync(configPath))).toEqual({ plugins: [] });
        }
      );

      test(
        'should print log messages correctly',
        async () => {
          const log = jest.spyOn(logger, 'log');

          const core = new Core(ant);
          const mockedGlobalPath = path.resolve(outPath, 'global');
          core._getGlobalConfigPath = () => mockedGlobalPath;

          fs.writeFileSync(mockedGlobalPath, yaml.safeDump({}));
          let configPath = await core.removePlugin('/foo/bar/myplugin', true);
          expect(log).toBeCalledWith('No plugins installed was found on global \
configuration file. plugin remove command should do nothing');
          expect(configPath).toBe(null);

          fs.writeFileSync(mockedGlobalPath, yaml.safeDump({ plugins: [] }));
          configPath = await core.removePlugin('/foo/bar/myplugin', true);
          expect(log).toBeCalledWith('Plugin "/foo/bar/myplugin" is already uninstalled from the global \
configuration file. plugin remove command should do nothing');
          expect(configPath).toBe(null);

          fs.writeFileSync(mockedGlobalPath, yaml.safeDump({ plugins: ['/foo/bar/myplugin'] }));
          configPath = await core.removePlugin('/foo/bar/myplugin', true);
          expect(log).toBeCalledWith('Plugin "/foo/bar/myplugin" uninstalled successfully from the global \
configuration file');
        }
      );
    });
  });
});
