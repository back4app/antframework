/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/plugins/core/lib/Core.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const yaml = require('yaml').default;
const { makeExecutableSchema } = require('graphql-tools');
const AntCli = require('../../../../../lib/cli/AntCli');
const Ant = require('../../../../../lib/Ant');
const Plugin = require('../../../../../lib/plugins/Plugin');
const Template = require('../../../../../lib/templates/Template');
const Core = require('../../../../../lib/plugins/core/lib/Core');
const nodeFs = require('fs');
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
            yaml.parse(
              fs.readFileSync(path.resolve(outPath, 'ant.yml'), 'utf8')
            ).service
          ).toEqual('MyService');
          makeExecutableSchema({
            typeDefs: fs.readFileSync(
              path.resolve(outPath, 'model.graphql'),
              'utf8'
            )
          });
          const originalCwd = process.cwd();
          process.chdir(path.resolve(
            __dirname,
            '../../../../support/configs/graphQLPluginConfig'
          ));
          const originalLog = console.log;
          console.log = jest.fn();
          const originalExit = process.exit;
          process.exit = jest.fn();
          (new AntCli()).execute();
          expect(process.exit).toHaveBeenCalledWith(0);
          expect(console.log).toHaveBeenCalledWith(expect.stringContaining(
            'Core, GraphQL'
          ));
          process.exit = originalExit;
          console.log = originalLog;
          process.chdir(originalCwd);
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
      describe('plugin add command', () => {
        test('should show friendly error when plugin was not passed', (done) => {
          process.argv = ['plugin', 'add'];
          console.error = jest.fn();
          process.exit = jest.fn((code) => {
            expect(console.error).toHaveBeenCalledWith(
              expect.stringContaining('Plugin add command requires plugin argument')
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

    test('should do nothing when unexpected error is thrown on plugin add', (done) => {
      process.argv = ['plugin', 'add'];
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

    test('should render template just with the template path', async (done) => {
      const core = new Core(ant);
      const originalRender = Template.prototype.render;
      const templatePath = core.templates[0].path;
      Template.prototype.render = jest.fn().mockImplementation(function() {
        Template.prototype.render = originalRender;
        expect(this._path).toBe(templatePath);
        expect(this._name).toBe('CLI Template');
        expect(this._category).toBe('Service');
        done();
      });
      const createServiceReturn = core.createService('abcd', templatePath);
      expect(createServiceReturn).toBeInstanceOf(Promise);
      await createServiceReturn;
    });

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

  describe('Core.pluginAdd', () => {
    const originalExistsSync = nodeFs.existsSync;
    const originalReadFileSync = nodeFs.readFileSync;
    const originalParseDocument = yaml.parseDocument;

    afterEach (() => {
      nodeFs.existsSync = originalExistsSync;
      nodeFs.readFileSync = originalReadFileSync;
      yaml.parseDocument = originalParseDocument;
    });

    test(
      'should be async and add plugin locally',
      async () => {
        const core = new Core(ant);
        const configPath = await core.addPlugin('/foo/bar/myplugin');
        const configFileContent = fs.readFileSync(configPath, 'utf-8');
        expect(configFileContent).toBe('plugins:\n  - /foo/bar/myplugin\n');
        expect(yaml.parse(configFileContent)).toEqual({ plugins: [ '/foo/bar/myplugin' ] });
      }
    );

    test(
      'should add and keep comments',
      async () => {
        const configFileContent = '# Should not be removed\n' +
          'plugins:\n' +
          '  - ./plugins/core\n' +
          '\n' +
          '  # Should not be removed below\n';
        nodeFs.existsSync = jest.fn().mockImplementation(() => true);
        nodeFs.readFileSync = jest.fn().mockImplementation(() => configFileContent);

        const core = new Core(ant);
        const configPath = await core.addPlugin('/foo/bar/myplugin');
        const actualConfigFileContent = fs.readFileSync(configPath, 'utf-8');

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
      'should consider empty config object when yaml loads null',
      async () => {
        nodeFs.existsSync = () => true;
        nodeFs.readFileSync = () => '';
        yaml.safeLoad = () => null;

        const core = new Core(ant);
        const configPath = await core.addPlugin('/foo/bar/myplugin');
        expect(yaml.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual({ plugins: [ '/foo/bar/myplugin' ] });
      }
    );

    test(
      'should append the plugin to the existant configuration',
      async () => {
        nodeFs.existsSync = () => true;
        nodeFs.readFileSync = () => 'plugins:\n - /existant/plugin';

        const core = new Core(ant);
        const configPath = await core.addPlugin('/foo/bar/myplugin');
        expect(yaml.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual({ plugins: [ '/existant/plugin', '/foo/bar/myplugin' ] });
      }
    );

    test(
      'should do nothing because plugin is already added',
      async () => {
        nodeFs.existsSync = () => true;
        nodeFs.readFileSync = () => 'plugins:\n - /foo/bar/myplugin';

        const core = new Core(ant);
        const configPath = await core.addPlugin('/foo/bar/myplugin');
        expect(configPath).toBe(null);
      }
    );

    test(
      'should fail when loading invalid config file',
      async () => {
        nodeFs.existsSync = () => true;
        yaml.parseDocument = jest.fn().mockImplementation(() => {
          throw new Error('Mocked error');
        });

        const core = new Core(ant);
        await expect(core.addPlugin('/foo/bar/myplugin')).rejects
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
        'should be async and add plugin globally',
        async () => {
          const plugin = '/foo/bar/myplugin';
          nodeFs.readFileSync = () => '';
          nodeFs.writeFileSync = (path, data) => {
            expect(path).toBe(core._getGlobalConfigPath());
            expect(data).toBe(`plugins:\n  - ${plugin}\n`);
          };

          const core = new Core(ant);
          await core.addPlugin(plugin, true);
        }
      );

      test(
        'should fail when loading invalid global config file',
        async () => {
          yaml.parseDocument = jest.fn().mockImplementation(() => {
            throw new Error('Mocked error');
          });

          const core = new Core(ant);
          await core.addPlugin('/foo/bar/myplugin', true).catch(
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
          const localConfigFilePath = await core.addPlugin('/foo/bar/myplugin', false);
          const configPath = await core.removePlugin('/foo/bar/myplugin');
          expect(configPath).toBe(localConfigFilePath);
          expect(yaml.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual({ plugins: [] });
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
          const log = jest.spyOn(console, 'log');
          const core = new Core(ant);
          const configFilePath = core._getLocalConfigPath();
          fs.writeFileSync(configFilePath, '');

          const configPath = await core.removePlugin('/foo/bar/myplugin');
          expect(configPath).toBe(null);
          expect(log).toBeCalledWith('Configuration not found. plugin remove command should do nothing');
        }
      );

      test(
        'should do nothing because config file does not have a plugins entry',
        async () => {
          const log = jest.spyOn(console, 'log');
          const core = new Core(ant);
          const configFilePath = core._getLocalConfigPath();
          fs.writeFileSync(configFilePath, 'foo: bar');

          const configPath = await core.removePlugin('/foo/bar/myplugin');
          expect(configPath).toBe(null);
          expect(log).toBeCalledWith('No plugins was found on local configuration file. \
plugin remove command should do nothing');
        }
      );

      test(
        'should do nothing because plugins is empty',
        async () => {
          const log = jest.spyOn(console, 'log');
          const core = new Core(ant);
          const configFilePath = core._getLocalConfigPath();
          fs.writeFileSync(configFilePath, 'plugins:\n  []\n');

          const configPath = await core.removePlugin('/foo/bar/myplugin');
          expect(configPath).toBe(null);
          expect(log).toHaveBeenCalledWith('Plugin "/foo/bar/myplugin" was \
not found on local configuration file. plugin remove command should do nothing');
        }
      );
    });
    describe('global configuration', () => {
      test(
        'should be async and remove plugin globally',
        async () => {
          const core = new Core(ant);
          const mockedGlobalPath = path.resolve(outPath, 'global');
          fs.writeFileSync(mockedGlobalPath, yaml.stringify({ plugins: [] }));
          core._getGlobalConfigPath = () => mockedGlobalPath;
          const globalConfigFilePath = await core.addPlugin('/foo/bar/myplugin', true);
          const configPath = await core.removePlugin('/foo/bar/myplugin', true);
          expect(configPath).toBe(globalConfigFilePath);
          expect(yaml.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual({ plugins: [] });
        }
      );

      test(
        'should print log messages correctly',
        async () => {
          const log = jest.spyOn(console, 'log');

          const core = new Core(ant);
          const mockedGlobalPath = path.resolve(outPath, 'global');
          core._getGlobalConfigPath = () => mockedGlobalPath;

          fs.writeFileSync(mockedGlobalPath, yaml.stringify({}));
          let configPath = await core.removePlugin('/foo/bar/myplugin', true);
          expect(log).toHaveBeenLastCalledWith('No plugins was found on global configuration file. \
plugin remove command should do nothing');
          expect(configPath).toBe(null);

          fs.writeFileSync(mockedGlobalPath, yaml.stringify({ plugins: [] }));
          configPath = await core.removePlugin('/foo/bar/myplugin', true);
          expect(log).toHaveBeenLastCalledWith('Plugin "/foo/bar/myplugin" was not found on global \
configuration file. plugin remove command should do nothing');
          expect(configPath).toBe(null);

          fs.writeFileSync(mockedGlobalPath, yaml.stringify({ plugins: ['/foo/bar/myplugin'] }));
          configPath = await core.removePlugin('/foo/bar/myplugin', true);
          expect(log).toHaveBeenLastCalledWith('Plugin "/foo/bar/myplugin" successfully removed globally');
        }
      );
    });
  });
});
