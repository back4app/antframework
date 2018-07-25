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
    test('should load "create" command', (done) => {
      const originalLog = console.log;
      console.log = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Service "MyService" successfully created')
        );
        expect(code).toEqual(0);
        console.log = originalLog;
        process.exit = originalExit;
        done();
      });
      (new AntCli())._yargs.parse('create MyService');
    });

    test('should have "template" option', (done) => {
      const originalLog = console.log;
      console.log = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Service "MyService" successfully created')
        );
        expect(code).toEqual(0);
        console.log = originalLog;
        process.exit = originalExit;
        done();
      });
      (new AntCli())._yargs.parse('create MyService --template Default');
    });

    test('should have "t" option alias', (done) => {
      const originalLog = console.log;
      console.log = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Service "MyService" successfully created')
        );
        expect(code).toEqual(0);
        console.log = originalLog;
        process.exit = originalExit;
        done();
      });
      (new AntCli())._yargs.parse('create MyService -t Default');
    });

    test('should show friendly errors', (done) => {
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Could not create service: template "NotExistent" was not found'
          )
        );
        expect(code).toEqual(1);
        console.error = originalError;
        process.exit = originalExit;
        done();
      });
      (new AntCli())._yargs.parse('create MyService --template NotExistent');
    });

    test('should show friendly error when service name not passed', (done) => {
      const originalArgv = process.argv;
      process.argv.push('create');
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Create command requires service argument'
          )
        );
        expect(code).toEqual(1);
        console.argv = originalArgv;
        console.error = originalError;
        process.exit = originalExit;
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
      const originalArgv = process.argv;
      process.argv.push('create');
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Create command only accepts 1 argument'
          )
        );
        expect(code).toEqual(1);
        console.argv = originalArgv;
        console.error = originalError;
        process.exit = originalExit;
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
      const originalArgv = process.argv;
      process.argv.push('create');
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Template option requires name argument'
          )
        );
        expect(code).toEqual(1);
        console.argv = originalArgv;
        console.error = originalError;
        process.exit = originalExit;
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

    test('should not change the error message for other cases', () => {
      const originalArgv = process.argv;
      process.argv.push('create');
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
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

      console.argv = originalArgv;
      console.error = originalError;
      process.exit = originalExit;
    });

    test('should show error stack in verbose mode', (done) => {
      const originalArgv = process.argv;
      process.argv.push('-v');
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Error stack:'
          )
        );
        expect(code).toEqual(1);
        console.error = originalError;
        process.exit = originalExit;
        process.argv = originalArgv;
        done();
      });
      (new AntCli())._yargs.parse('create -v MyService --template NotExistent');
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
