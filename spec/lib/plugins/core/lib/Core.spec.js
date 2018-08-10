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
const yargsHelper = require('../../../../../lib/util/yargsHelper');
const Config = require('../../../../../lib/Config');
const configUtil = require('../../../../../lib/util/config');

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
        test('should add and save locally', async () => {
          const getLocalConfigPath = jest.spyOn(configUtil, 'getLocalConfigPath');
          const addPlugin = jest.spyOn(Config.prototype, 'addPlugin');
          const save = jest.spyOn(Config.prototype, 'save');
          const myPlugin = 'myplugin';
          const core = new Core(ant);
          await core.addPlugin(myPlugin);
          expect(getLocalConfigPath).toHaveBeenCalled();
          expect(addPlugin).toHaveBeenCalledWith(myPlugin);
          expect(save).toHaveBeenCalled();
        });

        test('should add and save globally', async () => {
          const getLocalConfigPath = jest.spyOn(configUtil, 'getLocalConfigPath');
          const addPlugin = jest.spyOn(Config.prototype, 'addPlugin');
          const originalSave = Config.prototype.save;
          const save = Config.prototype.save = jest.fn();
          const myPlugin = 'myplugin';
          const core = new Core(ant);
          await core.addPlugin(myPlugin, true);
          expect(getLocalConfigPath).not.toHaveBeenCalled();
          expect(addPlugin).toHaveBeenCalledWith(myPlugin);
          expect(save).toHaveBeenCalled();
          Config.prototype.save = originalSave;
        });

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
        test('should remove and save locally', async () => {
          const getLocalConfigPath = jest.spyOn(configUtil, 'getLocalConfigPath');
          const removePlugin = jest.spyOn(Config.prototype, 'removePlugin');
          const save = jest.spyOn(Config.prototype, 'save');
          const myPlugin = 'myplugin';
          const core = new Core(ant);
          await core.removePlugin(myPlugin);
          expect(getLocalConfigPath).toHaveBeenCalled();
          expect(removePlugin).toHaveBeenCalledWith(myPlugin);
          expect(save).toHaveBeenCalled();
        });

        test('should remove and save globally', async () => {
          const getLocalConfigPath = jest.spyOn(configUtil, 'getLocalConfigPath');
          const removePlugin = jest.spyOn(Config.prototype, 'removePlugin');
          const originalSave = Config.prototype.save;
          const save = Config.prototype.save = jest.fn();
          const myPlugin = 'myplugin';
          const core = new Core(ant);
          await core.removePlugin(myPlugin, true);
          expect(getLocalConfigPath).not.toHaveBeenCalled();
          expect(removePlugin).toHaveBeenCalledWith(myPlugin);
          expect(save).toHaveBeenCalled();
          Config.prototype.save = originalSave;
        });

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

    describe('template command', () => {
      const originalSave = Config.prototype.save;

      beforeEach(() => {
        Config.prototype.save = jest.fn();
      });

      afterEach(() => {
        Config.prototype.save = originalSave;
      });

      describe('template add command', () => {
        test('should add and save locally', async () => {
          const getLocalConfigPath = jest.spyOn(configUtil, 'getLocalConfigPath');
          const addTemplate = jest.spyOn(Config.prototype, 'addTemplate');
          const myTemplate = 'myTemplate';
          const templatePath = 'path/to/my/template';
          const category = 'myCategory';
          const core = new Core(ant);
          await core.addTemplate(myTemplate, templatePath, category);
          expect(getLocalConfigPath).toHaveBeenCalled();
          expect(addTemplate).toHaveBeenCalledWith(myTemplate, templatePath, category);
          expect(Config.prototype.save).toHaveBeenCalled();
        });

        test('should add and save globally', async () => {
          const getLocalConfigPath = jest.spyOn(configUtil, 'getLocalConfigPath');
          const addTemplate = jest.spyOn(Config.prototype, 'addTemplate');
          const myTemplate = 'myTemplate';
          const templatePath = 'path/to/my/template';
          const category = 'myCategory';
          const core = new Core(ant);
          await core.addTemplate(myTemplate, templatePath, category, true);
          expect(getLocalConfigPath).not.toHaveBeenCalled();
          expect(addTemplate).toHaveBeenCalledWith(myTemplate, templatePath, category);
          expect(Config.prototype.save).toHaveBeenCalled();
        });

        test('should show friendly error when template was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'add'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Template add command requires template and templatePath arguments', null, 'template add'
            );
            expect(code).toEqual(1);
            done();
          });
          new Core(ant)._yargsFailed('Not enough non-option arguments');
        });

        test('should show friendly error when templatePath was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'add'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Template add command requires template and templatePath arguments', null, 'template add'
            );
            expect(code).toEqual(1);
            done();
          });
          new Core(ant)._yargsFailed('Not enough non-option arguments');
        });

        test('should not show friendly error when error is unknown', () => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'add'];
          new Core(ant)._yargsFailed('Unknown error');
          expect(handleErrorMessage).not.toHaveBeenCalled();
        });
      });

      describe('template remove command', () => {
        test('should remove and save locally', async () => {
          const getLocalConfigPath = jest.spyOn(configUtil, 'getLocalConfigPath');
          const removeTemplate = jest.spyOn(Config.prototype, 'removeTemplate');
          const myTemplate = 'myTemplate';
          const category = 'myCategory';
          const core = new Core(ant);
          await core.removeTemplate(myTemplate, category);
          expect(getLocalConfigPath).toHaveBeenCalled();
          expect(removeTemplate).toHaveBeenCalledWith(myTemplate, category);
          expect(Config.prototype.save).toHaveBeenCalled();
        });

        test('should remove and save globally', async () => {
          const getLocalConfigPath = jest.spyOn(configUtil, 'getLocalConfigPath');
          const removeTemplate = jest.spyOn(Config.prototype, 'removeTemplate');
          const myTemplate = 'myTemplate';
          const category = 'myCategory';
          const core = new Core(ant);
          await core.removeTemplate(myTemplate, category, true);
          expect(getLocalConfigPath).not.toHaveBeenCalled();
          expect(removeTemplate).toHaveBeenCalledWith(myTemplate, category);
          expect(Config.prototype.save).toHaveBeenCalled();
        });

        test('should show friendly error when template was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'remove'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Template remove command requires template argument', null, 'template remove'
            );
            expect(code).toEqual(1);
            done();
          });
          new Core(ant)._yargsFailed('Not enough non-option arguments');
        });

        test('should not show friendly error when error is unknown', () => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'remove'];
          new Core(ant)._yargsFailed('Unknown error');
          expect(handleErrorMessage).not.toHaveBeenCalled();
        });
      });

      describe('ls command', () => {
        test('should list templates', async () => {
          const core = new Core(ant);
          const log = jest.spyOn(console, 'log');
          const getAllTemplates = jest.spyOn(ant.templateController, 'getAllTemplates');

          await core.listTemplates();
          expect(log).toHaveBeenCalledWith('Listing all templates available (<category>: <name> <path>):');
          expect(getAllTemplates).toHaveBeenCalled();
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
});
