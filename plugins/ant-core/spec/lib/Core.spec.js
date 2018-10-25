/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/Core.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const yaml = require('yaml').default;
const { makeExecutableSchema } = require('graphql-tools');
const { yargsHelper } = require('@back4app/ant-util-yargs');
const {
  Config,
  Ant,
  AntFunction,
  BinFunction,
  Runtime,
  LibFunction,
  Provider,
  Host,
  Template,
  Plugin
} = require('@back4app/ant');
const { AntCli } = require('@back4app/ant-cli');
const Core = require('../../lib/Core');

const utilPath = path.resolve(
  __dirname,
  '../../node_modules/@back4app/ant-util-tests'
);

const ant = new Ant();

describe('lib/Core.js', () => {
  const originalCwd = process.cwd();
  const outPath = path.resolve(
    __dirname,
    '../support/out/lib/Core.js',
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
            utilPath,
            'configs/graphQLPluginConfig'
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
          'Unknown argument: templatetemplate',
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

    describe('deploy command', () => {
      test('should load "deploy" command', (done) => {
        console.log = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Service successfully deployed')
          );
          expect(code).toEqual(0);
          done();
        });
        const fooServicePath = path.resolve(
          utilPath,
          'services/FooService'
        );
        process.chdir(fooServicePath);
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Serverless').deploy = () => {};
        (antCli)._yargs.parse(
          `deploy --config ${fooServicePath}/ant.yml`
        );
      });

      test('should show friendly errors', (done) => {
        console.error = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
              'Could not find service config'
            )
          );
          expect(code).toEqual(1);
          done();
        });
        (new AntCli())._yargs.parse('deploy');
      });

      test('should accept no arguments', (done) => {
        process.argv = ['deploy'];
        console.error = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
              'Deploy command accepts no arguments'
            )
          );
          expect(code).toEqual(1);
          done();
        });
        const core = new Core(ant);
        core._yargsFailed(
          'Unknown argument: configpath',
          {
            handleErrorMessage: (msg, err, command) =>
              (new AntCli())._handleErrorMessage(msg, err, command)
          }
        );
      });
    });

    describe('plugin command', () => {
      test('should show friendly error when no command is given', (done) => {
        process.argv = ['plugin'];
        console.error = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Plugin requires a command')
          );
          expect(code).toEqual(1);
          done();
        });
        const core = new Core(ant);
        core._yargsFailed('Not enough non-option arguments');
      });

      test('should not show friendly error when error is unknown', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['plugin'];
        new Core(ant)._yargsFailed('Unknown error');
        expect(handleErrorMessage).not.toHaveBeenCalled();
      });

      describe('plugin add command', () => {
        test('should add and save locally', async () => {
          const configFilePath = path.resolve(outPath, 'ant.yml');
          fs.ensureFileSync(configFilePath);
          const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
            .mockImplementation(() => configFilePath);
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
          const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath');
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

        test('should handle error message', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').addPlugin =
            jest.fn(
              () => {
                throw new Error('Some Error');
              }
            );
          const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
          yargsHelper.handleErrorMessage = jest.fn(message => {
            expect(message).toEqual(
              expect.stringContaining('Some Error')
            );
            yargsHelper.handleErrorMessage = originalHandleErrorMessage;
            done();
          });
          antCli._yargs.parse('plugin add fooPlugin');
        });

        test('should exit with code 0', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').addPlugin =
            jest.fn();
          const originalExit = process.exit;
          process.exit = jest.fn(code => {
            expect(code).toEqual(0);
            process.exit = originalExit;
            done();
          });
          antCli._yargs.parse('plugin add fooPlugin');
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
          const configFilePath = path.resolve(outPath, 'ant.yml');
          fs.ensureFileSync(configFilePath);
          const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
            .mockImplementation(() => configFilePath);
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
          const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath');
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

        test('should handle error message', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').removePlugin =
            jest.fn(
              () => {
                throw new Error('Some Error');
              }
            );
          const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
          yargsHelper.handleErrorMessage = jest.fn(message => {
            expect(message).toEqual(
              expect.stringContaining('Some Error')
            );
            yargsHelper.handleErrorMessage = originalHandleErrorMessage;
            done();
          });
          antCli._yargs.parse('plugin remove fooPlugin');
        });

        test('should exit with code 0', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').removePlugin =
            jest.fn();
          const originalExit = process.exit;
          process.exit = jest.fn(code => {
            expect(code).toEqual(0);
            process.exit = originalExit;
            done();
          });
          antCli._yargs.parse('plugin remove fooPlugin');
        });

        test('should show friendly error when plugin was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['plugin', 'remove'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Plugin remove command requires plugin argument', null, 'plugin remove', true
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

      test('should show friendly error when no command is given', (done) => {
        process.argv = ['template'];
        console.error = jest.fn();
        process.exit = jest.fn((code) => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Template requires a command')
          );
          expect(code).toEqual(1);
          done();
        });
        const core = new Core(ant);
        core._yargsFailed('Not enough non-option arguments');
      });

      test('should not show friendly error when error is unknown', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['template'];
        new Core(ant)._yargsFailed('Unknown error');
        expect(handleErrorMessage).not.toHaveBeenCalled();
      });

      describe('template add command', () => {
        test('should add and save locally', async () => {
          const configFilePath = path.resolve(outPath, 'ant.yml');
          fs.ensureFileSync(configFilePath);
          const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
            .mockImplementation(() => configFilePath);
          const addTemplate = jest.spyOn(Config.prototype, 'addTemplate');
          const myTemplate = 'myTemplate';
          const templatePath = 'path/to/my/template';
          const category = 'myCategory';
          const core = new Core(ant);
          await core.addTemplate(category, myTemplate, templatePath);
          expect(getLocalConfigPath).toHaveBeenCalled();
          expect(addTemplate).toHaveBeenCalledWith(category, myTemplate, templatePath);
          expect(Config.prototype.save).toHaveBeenCalled();
        });

        test('should add and save globally', async () => {
          const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath');
          const addTemplate = jest.spyOn(Config.prototype, 'addTemplate');
          const myTemplate = 'myTemplate';
          const templatePath = 'path/to/my/template';
          const category = 'myCategory';
          const core = new Core(ant);
          await core.addTemplate(category, myTemplate, templatePath, true);
          expect(getLocalConfigPath).not.toHaveBeenCalled();
          expect(addTemplate).toHaveBeenCalledWith(category, myTemplate, templatePath);
          expect(Config.prototype.save).toHaveBeenCalled();
        });

        test('should handle error message', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').addTemplate =
            jest.fn(
              () => {
                throw new Error('Some Error');
              }
            );
          const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
          yargsHelper.handleErrorMessage = jest.fn(message => {
            expect(message).toEqual(
              expect.stringContaining('Some Error')
            );
            yargsHelper.handleErrorMessage = originalHandleErrorMessage;
            done();
          });
          antCli._yargs.parse('template add fooCategory fooTemplate my/templ');
        });

        test('should exit with code 0', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').addTemplate =
            jest.fn();
          const originalExit = process.exit;
          process.exit = jest.fn(code => {
            expect(code).toEqual(0);
            process.exit = originalExit;
            done();
          });
          antCli._yargs.parse('template add fooCategory fooTemplate /my/templ');
        });

        test('should show friendly error when category was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'add'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Template add command requires category, template and path arguments', null, 'template add', true
            );
            expect(code).toEqual(1);
            done();
          });
          new Core(ant)._yargsFailed('Not enough non-option arguments');
        });

        test('should show friendly error when template was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'add', 'MyCategory'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Template add command requires category, template and path arguments', null, 'template add', true
            );
            expect(code).toEqual(1);
            done();
          });
          new Core(ant)._yargsFailed('Not enough non-option arguments');
        });

        test('should show friendly error when path was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'add', 'MyCategory', 'MyTemplate'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Template add command requires category, template and path arguments', null, 'template add', true
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
          const configFilePath = path.resolve(outPath, 'ant.yml');
          fs.ensureFileSync(configFilePath);
          const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
            .mockImplementation(() => configFilePath);
          const removeTemplate = jest.spyOn(Config.prototype, 'removeTemplate');
          const myTemplate = 'myTemplate';
          const category = 'myCategory';
          const core = new Core(ant);
          await core.removeTemplate(category, myTemplate);
          expect(getLocalConfigPath).toHaveBeenCalled();
          expect(removeTemplate).toHaveBeenCalledWith(category, myTemplate);
          expect(Config.prototype.save).toHaveBeenCalled();
        });

        test('should remove and save globally', async () => {
          const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath');
          const removeTemplate = jest.spyOn(Config.prototype, 'removeTemplate');
          const myTemplate = 'myTemplate';
          const category = 'myCategory';
          const core = new Core(ant);
          await core.removeTemplate(category, myTemplate, true);
          expect(getLocalConfigPath).not.toHaveBeenCalled();
          expect(removeTemplate).toHaveBeenCalledWith(category, myTemplate);
          expect(Config.prototype.save).toHaveBeenCalled();
        });

        test('should handle error message', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').removeTemplate =
            jest.fn(
              () => {
                throw new Error('Some Error');
              }
            );
          const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
          yargsHelper.handleErrorMessage = jest.fn(message => {
            expect(message).toEqual(
              expect.stringContaining('Some Error')
            );
            yargsHelper.handleErrorMessage = originalHandleErrorMessage;
            done();
          });
          antCli._yargs.parse('template remove fooCategory fooTemplate');
        });

        test('should exit with code 0', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').removeTemplate =
            jest.fn();
          const originalExit = process.exit;
          process.exit = jest.fn(code => {
            expect(code).toEqual(0);
            process.exit = originalExit;
            done();
          });
          antCli._yargs.parse('template remove fooCategory fooTemplate');
        });

        test('should show friendly error when template was not passed', (done) => {
          const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
          process.argv = ['template', 'remove'];
          process.exit = jest.fn((code) => {
            expect(handleErrorMessage).toHaveBeenCalledWith(
              'Template remove command requires category and template arguments', null, 'template remove', true
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

      describe('template ls command', () => {
        test('should list templates', async () => {
          const core = new Core(ant);
          const log = jest.spyOn(console, 'log');
          const getAllTemplates = jest.spyOn(ant.templateController, 'getAllTemplates');

          await core.listTemplates();
          expect(log).toHaveBeenCalledWith('Listing all templates available (<category>: <name> <path>):');
          expect(getAllTemplates).toHaveBeenCalled();
        });

        test('should handle error message', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').listTemplates =
            jest.fn(
              () => {
                throw new Error('Some Error');
              }
            );
          const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
          yargsHelper.handleErrorMessage = jest.fn(message => {
            expect(message).toEqual(
              expect.stringContaining('Some Error')
            );
            yargsHelper.handleErrorMessage = originalHandleErrorMessage;
            done();
          });
          antCli._yargs.parse('template ls');
        });

        test('should exit with code 0', done => {
          const antCli = new AntCli();
          antCli._ant.pluginController.getPlugin('Core').listTemplates =
            jest.fn();
          const originalExit = process.exit;
          process.exit = jest.fn(code => {
            expect(code).toEqual(0);
            process.exit = originalExit;
            done();
          });
          antCli._yargs.parse('template ls');
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

  describe('Core.deployService', () => {
    test('should be async and deploy each function to its host', async () => {
      const provider1 = new Provider('provider1', jest.fn());
      const provider2 = new Provider('provider2', jest.fn());
      const config1 = { fooMember1: 'fooValue1' };
      const config2 = { fooMember2: 'fooValue2' };
      const config3 = { fooMember3: 'fooValue3' };
      const host1 = new Host('host1', provider1, config1);
      const host2 = new Host('host2', provider2, config2);
      const host3 = new Host('host3', provider1, config3);
      const ant = new Ant({});
      const function1 = new AntFunction(ant, 'function1', undefined, host1);
      const function2 = new AntFunction(ant, 'function2', undefined, host2);
      const function3 = new AntFunction(ant, 'function3', undefined, host3);
      const function4 = new AntFunction(ant, 'function4', undefined, host1);
      const function5 = new AntFunction(ant, 'function5', undefined, host2);
      const function6 = new AntFunction(ant, 'function6', undefined, host3);
      ant.functionController.loadFunctions([
        function1,
        function2,
        function3,
        function4,
        function5,
        function6
      ]);
      const core = new Core(ant);
      const deployReturn = core.deployService();
      expect(deployReturn).toEqual(expect.any(Promise));
      await deployReturn;
      expect(provider1.deploy).toHaveBeenCalledWith(
        config1,
        [function1, function4]
      );
      expect(provider2.deploy).toHaveBeenCalledWith(
        config2,
        [function2, function5]
      );
      expect(provider1.deploy).toHaveBeenCalledWith(
        config3,
        [function3, function6]
      );
    });

    test(
      'should fail if ant was initialized without service config',
      async () => {
        expect.hasAssertions();
        const ant = new Ant();
        const core = new Core(ant);
        try {
          await core.deployService();
        } catch (e) {
          expect(e.message).toEqual('Could not find service config');
        }
      }
    );

    test(
      'should fail if there is a function with no host assigned to it',
      async () => {
        expect.hasAssertions();
        const ant = new Ant({});
        ant.functionController.loadFunctions([
          new AntFunction(ant, 'fooFunction')
        ]);
        const core = new Core(ant);
        try {
          await core.deployService();
        } catch (e) {
          expect(e.message).toEqual(
            'There is not a host assigned to the "fooFunction" function'
          );
        }
      }
    );

    test(
      'should fail if there is no functions to be deployed',
      async () => {
        expect.hasAssertions();
        const ant = new Ant({});
        const core = new Core(ant);
        try {
          await core.deployService();
        } catch (e) {
          expect(e.message).toEqual(
            'There are no functions to be deployed.'
          );
        }
      }
    );
  });

  describe('function command', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    test('should show friendly error when no command is given', () => {
      const originalArgv = process.argv;
      process.argv = ['function'];
      const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
      yargsHelper.handleErrorMessage = jest.fn();
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      try {
        new Core(ant)._yargsFailed('Not enough non-option arguments');
        expect(handleErrorMessage).toHaveBeenCalledWith('Function requires a command', null, 'function', true);
      } finally {
        process.argv = originalArgv;
        yargsHelper.handleErrorMessage = originalHandleErrorMessage;
      }
    });

    test('should not show friendly error when error is unknown', () => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['function'];
      new Core(ant)._yargsFailed('Unknown error');
      expect(handleErrorMessage).not.toHaveBeenCalled();
    });

    describe('function add command', () => {
      test('should add BinFunction and save locally', async () => {
        const name = 'myFunc';
        const func = '/path/to/func';
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configFilePath);
        jest.spyOn(Config.prototype, 'addFunction')
          .mockImplementation(binFunc => {
            expect(binFunc.name).toBe(name);
            expect(binFunc.bin).toBe(func);
          });
        jest.spyOn(Config.prototype, 'save');
        const core = new Core(ant);
        await core.addFunction(name, func, null, null, 'bin');
        expect(getLocalConfigPath).toHaveBeenCalled();
        expect(Config.prototype.save).toHaveBeenCalled();
      });

      test('should add BinFunction and save globally', async () => {
        const name = 'myFunc';
        const func = '/path/to/func';
        const configMock = {
          addFunction: jest.fn().mockImplementation(binFunc => {
            expect(binFunc.name).toBe(name);
            expect(binFunc.bin).toBe(func);
          }),
          save: jest.fn()
        };
        jest.spyOn(Core, '_getConfig').mockImplementation(() => configMock);
        const core = new Core(ant);
        await core.addFunction(name, func, null, null, 'bin', true);
        expect(Core._getConfig).toHaveBeenCalledWith(true);
        expect(configMock.addFunction).toHaveBeenCalled();
        expect(configMock.save).toHaveBeenCalled();
      });

      test('should add LibFunction', async () => {
        const ant = new Ant();
        const name = 'myFunc';
        const func = '/path/to/func';
        const runtimeInstance = new Runtime(ant, 'myRuntime', '/path/to/runtime', [], undefined, '1');
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configFilePath);
        const getRuntime = jest.spyOn(ant.runtimeController, 'getRuntime')
          .mockImplementation(() => {
            return runtimeInstance;
          });
        jest.spyOn(Config.prototype, 'addFunction')
          .mockImplementation(libFunc => {
            expect(libFunc.name).toBe(name);
            expect(libFunc.handler).toBe(func);
            expect(libFunc.runtime).toBe(runtimeInstance);
          });
        const save = jest.spyOn(Config.prototype, 'save');
        const core = new Core(ant);
        await core.addFunction(name, func, runtimeInstance.name, runtimeInstance.version, 'lib');
        expect(getLocalConfigPath).toHaveBeenCalled();
        expect(getRuntime).toHaveBeenCalledWith(runtimeInstance.name, runtimeInstance.version);
        expect(save).toHaveBeenCalled();
      });

      test('should add LibFunction with default runtime', async () => {
        const ant = new Ant();
        const name = 'myFunc';
        const func = '/path/to/func';
        const runtimeInstance = new Runtime(ant, 'myRuntime', '/path/to/runtime', [], undefined, '1');
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configFilePath);
        const getRuntime = jest.spyOn(ant.runtimeController, 'getRuntime');
        ant.runtimeController.defaultRuntime = runtimeInstance;
        jest.spyOn(Config.prototype, 'addFunction')
          .mockImplementation(libFunc => {
            expect(libFunc.name).toBe(name);
            expect(libFunc.handler).toBe(func);
            expect(libFunc.runtime).toBe(runtimeInstance);
          });
        const save = jest.spyOn(Config.prototype, 'save');
        const core = new Core(ant);
        await core.addFunction(name, func, null);
        expect(getLocalConfigPath).toHaveBeenCalled();
        expect(getRuntime).not.toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
      });

      test('should add LibFunction with default runtime and no defined path', async () => {
        const ant = new Ant();
        const name = 'myFunc';
        const runtimeInstance = new Runtime(ant, 'myRuntime', '/path/to/runtime', ['foo'], undefined, '1');
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configFilePath);
        const getRuntime = jest.spyOn(ant.runtimeController, 'getRuntime');
        ant.runtimeController.defaultRuntime = runtimeInstance;
        jest.spyOn(Config.prototype, 'addFunction')
          .mockImplementation(libFunc => {
            expect(libFunc.name).toBe(name);
            expect(libFunc.handler).toBe(`./${name}.foo`);
            expect(libFunc.runtime).toBe(runtimeInstance);
          });
        const save = jest.spyOn(Config.prototype, 'save');
        const core = new Core(ant);
        await core.addFunction(name);
        expect(getLocalConfigPath).toHaveBeenCalled();
        expect(getRuntime).not.toHaveBeenCalled();
        expect(save).toHaveBeenCalled();
      });

      test('should add LibFunction and use runtime template to render function file', async () => {
        const ant = new Ant();
        const name = 'myFunc';
        const core = new Core(ant);
        fs.ensureFileSync(path.resolve(outPath, 'ant.yml'));
        const originalRender = Template.prototype.render;
        const render = Template.prototype.render = jest.fn();
        const funcPath = '/foo/bar/myFunc.js';
        try {
          await core.addFunction(name, funcPath);
          expect(render).toHaveBeenCalledWith(
            funcPath,
            expect.any(Object)
          );
        } finally {
          Template.prototype.render = originalRender;
        }
      });

      test('should add LibFunction and use custom template to render function file', async () => {
        const ant = new Ant();
        const name = 'myFunc';
        const core = new Core(ant);
        fs.ensureFileSync(path.resolve(outPath, 'ant.yml'));
        const fooRuntime = new Runtime(ant, 'Foo', '/bin/foo', ['js'], undefined, '1');
        ant.runtimeController.loadRuntimes([fooRuntime]);
        const originalRender = Template.prototype.render;
        const render = Template.prototype.render = jest.fn();
        const funcPath = path.resolve(outPath, 'foo/bar/myFunc.js');
        const getTemplate = jest.spyOn(ant.templateController, 'getTemplate').mockImplementation((category, template) => {
          expect(category).toBe('Function');
          expect(template).toBe('Foo');
          return new Template('Function', 'Foo', '/foo/template/path');
        });
        try {
          await core.addFunction(name, funcPath, 'Foo');
          expect(getTemplate).toHaveBeenCalledWith('Function', 'Foo');
          expect(render).toHaveBeenCalledWith(
            funcPath,
            expect.any(Object)
          );
        } catch (err){
          throw err;
        } finally {
          Template.prototype.render = originalRender;
        }
      });

      test('should add LibFunction and use template arg to render function file', async () => {
        const ant = new Ant();
        const name = 'myFunc';
        const core = new Core(ant);
        fs.ensureFileSync(path.resolve(outPath, 'ant.yml'));
        const fooRuntime = new Runtime(ant, 'Foo', '/bin/foo', ['js'], undefined, '1');
        ant.runtimeController.loadRuntimes([fooRuntime]);

        const templateMocked = new Template('Function', 'myTemplate', '/myTemplate/path');
        templateMocked.render = jest.fn();
        ant.templateController.loadTemplates([templateMocked]);
        jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
        const funcPath = path.resolve(outPath, 'foo/bar/myFunc.js');
        await core.addFunction(name, funcPath, 'Foo', undefined, undefined, undefined, 'myTemplate');
        expect(templateMocked.render).toHaveBeenCalledWith(
          funcPath,
          expect.any(Object)
        );
      });

      test('should handle error message', done => {
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Core').addFunction = jest.fn(
          () => {
            throw new Error('Some Error');
          }
        );
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn(message => {
          expect(message).toEqual(
            expect.stringContaining('Some Error')
          );
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          done();
        });
        antCli._yargs.parse('function add fooFunction my/fooFunction');
      });

      test('should exit with code 0', done => {
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Core').addFunction =
          jest.fn();
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          expect(code).toEqual(0);
          process.exit = originalExit;
          done();
        });
        antCli._yargs.parse('function add fooFunction');
      });

      test('should fail to render LibFunction source file due to inexistent template path', async () => {
        const ant = new Ant();
        const name = 'myFunc';
        const core = new Core(ant);
        fs.ensureFileSync(path.resolve(outPath, 'ant.yml'));
        jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
        try {
          await core.addFunction(name, null, null, undefined, undefined, undefined, '/my/invalid/path');
        } catch (err) {
          expect(err.message).toBe('Param "template" is not a valid path: /my/invalid/path');
        }
      });

      test('should fail to add LibFunction due to inexistent runtime', async () => {
        const ant = new Ant();
        const core = new Core(ant);
        fs.ensureFileSync(path.resolve(outPath, 'ant.yml'));
        try {
          await core.addFunction(null, null, 'should not find me', '1');
        } catch (err) {
          expect(err.message).toBe('Runtime "should not find me 1" was not found');
        }
      });

      test('should not add due to unknown type', async () => {
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const ant = new Ant();
        const name = 'myFunc';
        const func = '/path/to/func';
        const core = new Core(ant);
        expect(core.addFunction(name, func, null, null, 'foo'))
          .rejects.toThrowError('AntFunction type "foo" is unknown');
      });

      test('should show friendly error when name was not passed', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementationOnce(() => {});
        const originalArgv = process.argv;
        process.argv = ['function', 'add'];
        new Core(ant)._yargsFailed('Not enough non-option arguments');
        expect(handleErrorMessage).toHaveBeenCalledWith(
          'Function add command requires name and function arguments',
          null,
          'function add',
          true
        );
        process.argv = originalArgv;
      });

      test('should show friendly error when function was not passed', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementationOnce(() => {});
        const originalArgv = process.argv;
        process.argv = ['function', 'add', 'myfunc'];
        new Core(ant)._yargsFailed('Not enough non-option arguments');
        expect(handleErrorMessage).toHaveBeenCalledWith(
          'Function add command requires name and function arguments', null, 'function add', true
        );
        process.argv = originalArgv;
      });

      test('should not show friendly error when error is unknown', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['function', 'add'];
        new Core(ant)._yargsFailed('Unknown error');
        expect(handleErrorMessage).not.toHaveBeenCalled();
      });
    });

    describe('function remove command', () => {
      test('should remove function and save locally', async () => {
        const name = 'myFunc';
        const configMock = {
          removeFunction: jest.fn().mockImplementation(funcName => {
            expect(funcName).toBe(name);
            return configMock;
          }),
          save: jest.fn()
        };
        jest.spyOn(Core, '_getConfig').mockImplementation(() => configMock);
        const core = new Core(ant);
        await core.removeFunction(name);
        expect(Core._getConfig).toHaveBeenCalledWith(undefined);
        expect(configMock.removeFunction).toHaveBeenCalled();
        expect(configMock.save).toHaveBeenCalled();
      });

      test('should remove function and save globally', async () => {
        const name = 'myFunc';
        const configMock = {
          removeFunction: jest.fn().mockImplementation(funcName => {
            expect(funcName).toBe(name);
            return configMock;
          }),
          save: jest.fn()
        };
        jest.spyOn(Core, '_getConfig').mockImplementation(() => configMock);
        const core = new Core(ant);
        await core.removeFunction(name, true);
        expect(Core._getConfig).toHaveBeenCalledWith(true);
        expect(configMock.removeFunction).toHaveBeenCalled();
        expect(configMock.save).toHaveBeenCalled();
      });

      test('should handle error message', done => {
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Core').removeFunction = jest.fn(
          () => {
            throw new Error('Some Error');
          }
        );
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn(message => {
          expect(message).toEqual(
            expect.stringContaining('Some Error')
          );
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          done();
        });
        antCli._yargs.parse('function remove fooFunction');
      });

      test('should exit with code 0', done => {
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Core').removeFunction =
          jest.fn();
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          expect(code).toEqual(0);
          process.exit = originalExit;
          done();
        });
        antCli._yargs.parse('function remove fooFunction');
      });

      test('should show friendly error when name was not passed', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementationOnce(() => {});
        const originalArgv = process.argv;
        process.argv = ['function', 'remove'];
        new Core(ant)._yargsFailed('Not enough non-option arguments');
        process.argv = originalArgv;
        expect(handleErrorMessage).toHaveBeenCalledWith(
          'Function remove command requires name argument', null, 'function remove', true
        );
      });

      test('should not show friendly error when error is unknown', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['function', 'remove'];
        new Core(ant)._yargsFailed('Unknown error');
        expect(handleErrorMessage).not.toHaveBeenCalled();
      });
    });

    describe('function ls command', () => {
      test('should print functions', async () => {
        console.log = jest.fn();
        const functions = [
          new AntFunction(ant, 'ant', () => {}),
          new BinFunction(ant, 'foo', '/path/to/foo'),
          new LibFunction(ant, 'bar', '/path/to/bar', new Runtime(ant, 'barRuntime', '/path/to/runtime', [], undefined, '1'))
        ];
        ant.functionController.getAllFunctions = jest.fn().mockImplementation(() => functions);
        const core = new Core(ant);
        await core.listFunctions();
        expect(console.log.mock.calls.length).toBe(4);
        expect(console.log.mock.calls[0][0]).toBe('Listing all functions available \
(<type> <name>[: (<bin>|<handler> <runtime>)]):');
        expect(console.log.mock.calls[1][0]).toBe('AntFunction ant');
        expect(console.log.mock.calls[2][0]).toBe('BinFunction foo: /path/to/foo');
        expect(console.log.mock.calls[3][0]).toBe('LibFunction bar: /path/to/bar barRuntime 1');
      });

      test('should handle error message', done => {
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Core').listFunctions = jest.fn(
          () => {
            throw new Error('Some Error');
          }
        );
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn(message => {
          expect(message).toEqual(
            expect.stringContaining('Some Error')
          );
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          done();
        });
        antCli._yargs.parse('function ls');
      });

      test('should exit with code 0', done => {
        const antCli = new AntCli();
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          expect(code).toEqual(0);
          process.exit = originalExit;
          done();
        });
        antCli._yargs.parse('function ls');
      });
    });

    describe('function exec command', () => {
      test ('should throw error when function was not found', async () => {
        const name = 'should not be found';
        const core = new Core(ant);
        try {
          await core.execFunction(name);
        } catch (e) {
          expect(e.toString()).toEqual(expect.stringContaining(
            `Function ${name} not found to be executed.`
          ));
        }
      });

      test('should do nothing if function was not found', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementationOnce(() => {});
        const err = new Error('Mocked error');
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Core').execFunction = jest.fn().mockImplementation(() => {
          throw err;
        });
        antCli._yargs.parse('function exec myFunc');
        expect(handleErrorMessage).toHaveBeenCalledWith(err.message, err, 'function exec');
      });

      test ('should handle error message', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementationOnce(() => {});
        const err = new Error('Mocked error');
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Core').execFunction = jest.fn().mockImplementation(() => {
          throw err;
        });
        antCli._yargs.parse('function exec myFunc');
        expect(handleErrorMessage).toHaveBeenCalledWith(err.message, err, 'function exec');
      });

      test ('should execute function with args', async () => {
        const runMock = jest.fn();
        ant.functionController.getFunction = jest.fn().mockImplementation(() => {
          return {
            run: runMock
          };
        });
        const name = 'funcName';
        const args = ['foo', 'bar'];
        const core = new Core(ant);
        core.execFunction(name, args);
        expect(ant.functionController.getFunction).toHaveBeenCalledWith(name);
        expect(runMock).toHaveBeenCalledWith(...args);
      });

      test('should execute function with args v2', (done) => {
        const antCli = new AntCli();
        const runMock = jest.fn((onNext, _, onComplete) => {
          onNext('Some data');
          onComplete();
        });
        antCli._ant.functionController.getFunction = jest.fn().mockImplementation(() => {
          return {
            run: () => {
              return {
                subscribe: runMock
              };
            }
          };
        });
        const name = 'funcName';
        antCli._yargs.parse(`function exec ${name}`);
        process.exit = jest.fn((code) => {
          expect(code).toEqual(0);
          expect(antCli._ant.functionController.getFunction).toHaveBeenCalledWith(name);
          expect(runMock).toHaveBeenCalled();
          done();
        });
      });

      test('should log error', (done) => {
        const antCli = new AntCli();
        const runMock = jest.fn((_, onError) => {
          onError('Some error');
        });
        antCli._ant.functionController.getFunction = jest.fn().mockImplementation(() => {
          return {
            run: () => {
              return {
                subscribe: runMock
              };
            }
          };
        });
        const name = 'funcName';
        antCli._yargs.parse(`function exec ${name}`);
        process.exit = jest.fn((code) => {
          expect(code).toEqual(1);
          expect(antCli._ant.functionController.getFunction).toHaveBeenCalledWith(name);
          expect(runMock).toHaveBeenCalled();
          done();
        });
      });

      test('should show friendly error when name was not passed', async done => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['function', 'exec'];
        process.exit = jest.fn((code) => {
          expect(handleErrorMessage).toHaveBeenCalledWith(
            'Function exec command requires name argument', null, 'function exec', true
          );
          expect(code).toEqual(1);
          done();
        });
        new Core(ant)._yargsFailed('Not enough non-option arguments');
      });

      test('should not show friendly error when error is unknown', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['function', 'exec'];
        new Core(ant)._yargsFailed('Unknown error');
        expect(handleErrorMessage).not.toHaveBeenCalled();
      });
    });
  });

  describe('runtime command', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    test('should show friendly error when command was not passed', done => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['runtime'];
      process.exit = jest.fn(code => {
        expect(handleErrorMessage).toHaveBeenCalledWith(
          'Runtime requires a command', null, 'runtime', true
        );
        expect(code).toEqual(1);
        done();
      });
      new Core(ant)._yargsFailed('Not enough non-option arguments');
    });

    test('should not show friendly error when unknown error is thrown', () => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['runtime'];
      new Core(ant)._yargsFailed('Unknown error');
      expect(handleErrorMessage).not.toHaveBeenCalled();
    });

    describe('runtime add command', () => {
      test('should add runtime and save locally', async () => {
        const name = 'runtime';
        const version = '1';
        const bin = '/my/runtime';
        const extensions = [ 'js' ];
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configFilePath);
        const configMock = {
          save: jest.fn()
        };
        jest.spyOn(Config.prototype, 'addRuntime')
          .mockImplementation(runtime => {
            expect(runtime.name).toBe(name);
            expect(runtime.version).toBe(version);
            expect(runtime.bin).toBe(bin);
            expect(runtime.extensions).toBe(extensions);
            return configMock;
          });
        const core = new Core(ant);
        await core.addRuntime(name, version, bin, extensions);
        expect(getLocalConfigPath).toHaveBeenCalled();
        expect(configMock.save).toHaveBeenCalled();
      });

      test('should add runtime and save locally v2', (done) => {
        const antCli = new AntCli();
        const name = 'runtime';
        const version = '1';
        const bin = '/my/runtime';
        const extensions = 'js';
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configFilePath);
        const configMock = {
          save: jest.fn()
        };
        jest.spyOn(Config.prototype, 'addRuntime')
          .mockImplementation(runtime => {
            expect(runtime.name).toBe(name);
            expect(runtime.version).toBe(version);
            expect(runtime.bin).toEqual(expect.stringContaining(bin));
            expect(runtime.extensions).toEqual([extensions]);
            return configMock;
          });
        antCli._yargs.parse(`runtime add ${name} ${version} ${bin} ${extensions}`);
        process.exit = jest.fn((code) => {
          expect(code).toEqual(0);
          expect(getLocalConfigPath).toHaveBeenCalled();
          expect(configMock.save).toHaveBeenCalled();
          done();
        });
      });

      test('should handle error message', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementationOnce(() => {});
        const err = new Error('Mocked error');
        const antCli = new AntCli();
        antCli._ant.pluginController.getPlugin('Core').addRuntime = jest.fn().mockImplementation(() => {
          throw err;
        });
        antCli._yargs.parse('runtime add bla /bla bla');
        expect(handleErrorMessage).toHaveBeenCalledWith(err.message, err, 'runtime add');
      });

      test('should add runtime and save globally', async () => {
        const name = 'runtime';
        const version = '1';
        const bin = '/my/runtime';
        const extensions = [ 'js' ];
        const configMock = {
          addRuntime: jest.fn(runtime => {
            expect(runtime.name).toBe(name);
            expect(runtime.version).toBe(version);
            expect(runtime.bin).toBe(bin);
            expect(runtime.extensions).toBe(extensions);
            return configMock;
          }),
          save: jest.fn()
        };
        jest.spyOn(Core, '_getConfig').mockImplementation(() => configMock);
        const core = new Core(ant);
        await core.addRuntime(name, version, bin, extensions, true);
        expect(Core._getConfig).toHaveBeenCalledWith(true);
        expect(configMock.addRuntime).toHaveBeenCalled();
        expect(configMock.save).toHaveBeenCalled();
      });

      test('should show friendly error when name was not passed', done => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['runtime', 'add'];
        process.exit = jest.fn(code => {
          expect(handleErrorMessage).toHaveBeenCalledWith(
            'Runtime add command requires name, runtimeVersion and bin arguments', null, 'runtime add', true
          );
          expect(code).toEqual(1);
          done();
        });
        new Core(ant)._yargsFailed('Not enough non-option arguments');
      });

      test('should show friendly error when version was not passed', done => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['runtime', 'add', 'myruntime'];
        process.exit = jest.fn((code) => {
          expect(handleErrorMessage).toHaveBeenCalledWith(
            'Runtime add command requires name, runtimeVersion and bin arguments', null, 'runtime add', true
          );
          expect(code).toEqual(1);
          done();
        });
        new Core(ant)._yargsFailed('Not enough non-option arguments');
      });

      test('should show friendly error when bin was not passed', done => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['runtime', 'add', 'myruntime 123'];
        process.exit = jest.fn((code) => {
          expect(handleErrorMessage).toHaveBeenCalledWith(
            'Runtime add command requires name, runtimeVersion and bin arguments', null, 'runtime add', true
          );
          expect(code).toEqual(1);
          done();
        });
        new Core(ant)._yargsFailed('Not enough non-option arguments');
      });

      test('should not show friendly error when error is unknown', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['runtime', 'add'];
        new Core(ant)._yargsFailed('Unknown error');
        expect(handleErrorMessage).not.toHaveBeenCalled();
      });
    });

    describe('runtime remove command', () => {
      test('should remove runtime and save locally', async () => {
        const name = 'myRuntime';
        const version = '1';
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configFilePath);
        const removeRuntime = jest.spyOn(Config.prototype, 'removeRuntime');
        const save = jest.spyOn(Config.prototype, 'save');
        const core = new Core(ant);
        await core.removeRuntime(name, version);
        expect(getLocalConfigPath).toHaveBeenCalled();
        expect(removeRuntime).toHaveBeenCalledWith(name, version);
        expect(save).toHaveBeenCalled();
      });

      test('should handle error message', async () => {
        const antCli = new AntCli();
        const name = 'myRuntime';
        const version = '1';
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configFilePath);
        const removeRuntime = jest.fn(() => {
          throw new Error('Some remotion error');
        });
        const save = jest.spyOn(Config.prototype, 'save');
        const handleErrorMessage = jest.spyOn(
          yargsHelper,
          'handleErrorMessage'
        );
        antCli._yargs.parse(`runtime remove ${name} ${version}`);
        process.exit = jest.fn(code => {
          expect(code).toEqual(1);
          expect(getLocalConfigPath).toHaveBeenCalled();
          expect(removeRuntime).toHaveBeenCalled();
          expect(save).toHaveBeenCalled();
          expect(handleErrorMessage).toHaveBeenCalledWith();
        });
      });

      test('should remove runtime and save globally', async () => {
        const name = 'myRuntime';
        const version = '1';
        const configMock = {
          removeRuntime: jest.fn().mockImplementation((runtimeName, runtimeVersion) => {
            expect(runtimeName).toBe(name);
            expect(runtimeVersion).toBe(version);
            return configMock;
          }),
          save: jest.fn()
        };
        jest.spyOn(Core, '_getConfig').mockImplementation(() => configMock);
        const core = new Core(ant);
        await core.removeRuntime(name, version, true);
        expect(Core._getConfig).toHaveBeenCalledWith(true);
        expect(configMock.removeRuntime).toHaveBeenCalledWith(name, version);
        expect(configMock.save).toHaveBeenCalled();
      });

      test('should show friendly error when name was not passed', async done => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['runtime', 'remove'];
        process.exit = jest.fn((code) => {
          expect(handleErrorMessage).toHaveBeenCalledWith(
            'Runtime remove command requires name and runtimeVersion arguments', null, 'runtime remove', true
          );
          expect(code).toEqual(1);
          done();
        });
        new Core(ant)._yargsFailed('Not enough non-option arguments');
      });

      test('should show friendly error when runtimeVersion was not passed', async done => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['runtime', 'remove', 'node'];
        process.exit = jest.fn((code) => {
          expect(handleErrorMessage).toHaveBeenCalledWith(
            'Runtime remove command requires name and runtimeVersion arguments', null, 'runtime remove', true
          );
          expect(code).toEqual(1);
          done();
        });
        new Core(ant)._yargsFailed('Not enough non-option arguments');
      });

      test('should not show friendly error when error is unknown', () => {
        const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
        process.argv = ['runtime', 'remove'];
        new Core(ant)._yargsFailed('Unknown error');
        expect(handleErrorMessage).not.toHaveBeenCalled();
      });
    });

    describe('runtime ls command', () => {
      test('should print runtimes', async () => {
        console.log = jest.fn();
        const runtimes = [
          new Runtime(ant, 'foo', '/path/to/foo', ['foo', 'js'], '/foo/template', '4.0.0'),
          new Runtime(ant, 'bar', '/path/to/bar', ['bar'], undefined, '3.2.1'),
          new Runtime(ant, 'lorem', '/ipsum', [], undefined, '1'),
          new Runtime(ant, 'lorem', '/ipsum', [], undefined, '2')
        ];
        ant.runtimeController._runtimes = new Map();
        ant.runtimeController.loadRuntimes(runtimes);
        const core = new Core(ant);
        await core.listRuntimes();
        expect(console.log.mock.calls.length).toBe(5);
        expect(console.log.mock.calls[0][0]).toBe('Listing all runtimes available \
([default] <name> <version> <bin> [extensions] [template]):');
        expect(console.log.mock.calls[1][0]).toBe('default foo 4 /path/to/foo [foo, js] /foo/template');
        expect(console.log.mock.calls[2][0]).toBe('default bar 3 /path/to/bar [bar]');
        expect(console.log.mock.calls[3][0]).toBe('default lorem 1 /ipsum');
        expect(console.log.mock.calls[4][0]).toBe('lorem 2 /ipsum');
      });

      test('should print runtimes v2', (done) => {
        console.log = jest.fn();
        const antCli = new AntCli();
        const runtimes = [
          new Runtime(antCli._ant, 'foo', '/path/to/foo', ['foo', 'js'], '/foo/template', '4.0.0'),
          new Runtime(antCli._ant, 'bar', '/path/to/bar', ['bar'], undefined, '3.2.1'),
          new Runtime(antCli._ant, 'lorem', '/ipsum', [], undefined, '1'),
          new Runtime(antCli._ant, 'lorem', '/ipsum', [], undefined, '2')
        ];
        antCli._ant.runtimeController._runtimes = new Map();
        antCli._ant.runtimeController.loadRuntimes(runtimes);
        antCli._yargs.parse('runtime ls');
        process.exit = jest.fn(code => {
          expect(code).toEqual(1);
          expect(console.log.mock.calls.length).toBe(5);
          expect(console.log.mock.calls[0][0]).toBe('Listing all runtimes available \
([default] <name> <version> <bin> [extensions] [template]):');
          expect(console.log.mock.calls[1][0]).toBe('default foo 4 /path/to/foo [foo, js] /foo/template');
          expect(console.log.mock.calls[2][0]).toBe('default bar 3 /path/to/bar [bar]');
          expect(console.log.mock.calls[3][0]).toBe('default lorem 1 /ipsum');
          expect(console.log.mock.calls[4][0]).toBe('lorem 2 /ipsum');
          done();
        });
      });
    });
  });

  describe('static methods', () => {
    describe('_getConfig', () => {
      test('should return an instance of Config', () => {
        const configFilePath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configFilePath);
        const config = Core._getConfig(configFilePath);
        expect(config).toBeInstanceOf(Config);
        expect(config._path).toBe(configFilePath);
      });
    });
  });
});
