/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/plugins/graphQL/lib/GraphQL.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const childProcess = require('child_process');
const Ant = require('../../../../../lib/Ant');
const Config = require('../../../../../lib/config/Config');
const AntFunction = require('../../../../../lib/functions/AntFunction');
const LibFunction = require('../../../../../lib/functions/LibFunction');
const Runtime = require('../../../../../lib/functions/runtimes/Runtime');
const AntCli = require('../../../../../lib/cli/AntCli');
const Plugin = require('../../../../../lib/plugins/Plugin');
const GraphQL = require('../../../../../lib/plugins/graphQL/lib/GraphQL');
const Directive = require(
  '../../../../../lib/plugins/graphQL/lib/directives/Directive'
);
const DirectiveController = require(
  '../../../../../lib/plugins/graphQL/lib/directives/DirectiveController'
);
const yargsHelper = require('../../../../../lib/util/yargsHelper');

const ant = new Ant();

describe('lib/plugins/graphQL/lib/GraphQL.js', () => {
  const originalCwd = process.cwd();
  const outPath = path.resolve(
    __dirname,
    '../../../../support/out/lib/plugins/graphQL/lib/GraphQL.js',
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

  test('should export "GraphQL" class extending "Plugin" class', async () => {
    const graphQL = new GraphQL(ant);
    expect(graphQL.constructor.name).toEqual('GraphQL');
    expect(graphQL).toBeInstanceOf(Plugin);
    expect(graphQL.name).toEqual('GraphQL');
  });

  test('should fail if invalid server', () => {
    const graphQL = new GraphQL(ant, { server: '/foo/server' });
    expect(graphQL.startService()).rejects.toThrow();
  });

  test('should fail if server crashes', async () => {
    const originalError = console.error;
    console.error = jest.fn();
    expect.hasAssertions();
    const bin = path.resolve(
      __dirname,
      '../../../../support/templates/crashServerTemplate/server.js'
    );
    const server = { bin };
    const model = path.resolve(
      __dirname,
      '../../../../support/configs/graphQLPluginConfig/model.graphql'
    );
    const graphQL = new GraphQL(ant, { server, model });
    try {
      await graphQL.startService();
    } catch(e) {
      expect(e.message).toEqual(
        expect.stringContaining('Server process closed with code "1"')
      );
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(
        'Crashed'
      ));
      console.error = originalError;
    }
  });

  test('should fail if port is invalid', async () => {
    expect.hasAssertions();
    const port = 'FooPort';
    const server = { port };
    const model = path.resolve(
      __dirname,
      '../../../../support/configs/graphQLPluginConfig/model.graphql'
    );
    const graphQL = new GraphQL(ant, { server, model });
    try {
      await graphQL.startService();
    } catch(e) {
      expect(e.message).toEqual(
        expect.stringContaining('Could not start service: config setting "server.port" should be Number')
      );
    }
  });


  test('should fail if server send error event', async () => {
    expect.hasAssertions();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../../../support/configs/graphQLPluginConfig'
    ));
    const originalSpawn = childProcess.spawn;
    childProcess.spawn = jest.fn(() => { return {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'error') {
          callback(new Error('Some server error'));
        }
      })
    };});
    const graphQL = new GraphQL(ant);
    try {
      await graphQL.startService();
    } catch(e) {
      expect(e.message).toEqual(
        expect.stringContaining(
          'Server process crashed with error "Error: Some server error"'
        )
      );
      childProcess.spawn = originalSpawn;
      process.chdir(originalCwd);
    }
  });

  test('should fail if server process fail to be spawned', async () => {
    expect.hasAssertions();
    const originalSpawn = childProcess.spawn;
    childProcess.spawn = jest.fn(function (server) {
      if (server.contains('templates/server/default/bin/server.js')) {
        throw new Error('Some spawn error');
      } else {
        return originalSpawn(...arguments);
      }
    });
    const model = path.resolve(
      __dirname,
      '../../../../support/configs/graphQLPluginConfig/model.graphql'
    );
    const graphQL = new GraphQL(ant, { model });
    try {
      await graphQL.startService();
    } catch(e) {
      expect(e.message).toEqual(
        expect.stringContaining('Could not spawn server')
      );
    }
    childProcess.spawn = originalSpawn;
  });

  test('should show server logs', async () => {
    expect.hasAssertions();
    const originalExec = childProcess.exec;
    childProcess.exec = jest.fn();
    const originalError = console.error;
    const originalLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();
    const model = path.resolve(
      __dirname,
      '../../../../support/configs/graphQLPluginConfig/model.graphql'
    );
    const bin = path.resolve(
      __dirname,
      '../../../../support/templates/fooServerTemplate/server.js'
    );
    const server = { bin };
    const graphQL = new GraphQL(ant, { model, server });
    await graphQL.startService();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Some server error')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Some other log')
    );
    console.error = originalError;
    console.log = originalLog;
    childProcess.exec = originalExec;
  });

  test('should show success message', async (done) => {
    expect.hasAssertions();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../../../support/configs/graphQLPluginConfig'
    ));
    const originalExec = childProcess.exec;
    const originalLog = console.log;
    const graphQL = new GraphQL(ant);
    console.log = jest.fn((msg) => {
      expect(msg).toEqual(
        expect.stringContaining('GraphQL API server listening \
for requests on http://localhost:3000')
      );
    });
    childProcess.exec = jest.fn((command) => {
      expect(command).toEqual(
        expect.stringContaining('http://localhost:3000')
      );
      childProcess.exec = originalExec;
      process.chdir(originalCwd);
      console.log = originalLog;
      graphQL._serverProcess.kill();
    });
    try {
      await graphQL.startService();
    } catch(e) {
      expect(e.message).toEqual(
        expect.stringContaining('Server process closed')
      );
      done();
    }
  });

  test('should use open if mac', async (done) => {
    expect.hasAssertions();
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../../../support/configs/graphQLPluginConfig'
    ));
    const originalExec = childProcess.exec;
    const originalLog = console.log;
    const graphQL = new GraphQL(ant);
    console.log = jest.fn((msg) => {
      expect(msg).toEqual(
        expect.stringContaining('Server => GraphQL API server \
listening for requests on http://localhost:3000\n')
      );
    });
    childProcess.exec = jest.fn((command) => {
      expect(command).toEqual(
        expect.stringContaining('open http://localhost:3000')
      );
      childProcess.exec = originalExec;
      process.chdir(originalCwd);
      console.log = originalLog;
      graphQL._serverProcess.kill();
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
    try {
      await graphQL.startService();
    } catch(e) {
      expect(e.message).toEqual(
        expect.stringContaining('Server process closed')
      );
      done();
    }
  });

  test('should use xdg-open if other platform', async (done) => {
    expect.hasAssertions();
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'FooPlatform' });
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../../../support/configs/graphQLPluginConfig'
    ));
    const originalExec = childProcess.exec;
    const originalLog = console.log;
    const graphQL = new GraphQL(ant);
    console.log = jest.fn((msg) => {
      expect(msg).toEqual(
        expect.stringContaining('Server => GraphQL API server \
listening for requests on http://localhost:3000\n')
      );
    });
    childProcess.exec = jest.fn((command) => {
      expect(command).toEqual(
        expect.stringContaining('xdg-open http://localhost:3000')
      );
      childProcess.exec = originalExec;
      process.chdir(originalCwd);
      console.log = originalLog;
      graphQL._serverProcess.kill();
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
    try {
      await graphQL.startService();
    } catch(e) {
      expect(e.message).toEqual(
        expect.stringContaining('Server process closed')
      );
      done();
    }
  });

  test('should load directives', () => {
    const handler = '/path/to/foo';
    const runtime = 'Node';
    const definition = 'directive @fooDirective(param: String) on FIELD_DEFINITION';
    const graphQL = new GraphQL(ant, {
      directives: {
        fooDirective: {
          resolver: {
            handler,
            runtime
          },
          definition
        }
      }
    });
    const foo = graphQL.directiveController.getDirective('fooDirective');
    expect(foo.name).toBe('fooDirective');
    expect(foo.resolver.handler).toBe(handler);
    expect(foo.resolver.runtime.name).toBe(runtime);
    expect(foo.definition).toBe(definition);
  });

  describe('GraphQL.directives', () => {
    test('should be readonly and return the default directives', () => {
      const graphQL = new GraphQL(ant);
      expect(graphQL.directives).toEqual(expect.any(Array));
      expect(graphQL.directives).toHaveLength(3);
      expect(graphQL.directives[0]).toEqual(expect.any(Directive));
      expect(graphQL.directives[0].name).toEqual('mock');
      expect(graphQL.directives[1]).toEqual(expect.any(Directive));
      expect(graphQL.directives[1].name).toEqual('resolve');
      expect(graphQL.directives[2]).toEqual(expect.any(Directive));
      expect(graphQL.directives[2].name).toEqual('subscribe');
    });
  });

  describe('GraphQL.loadYargsSettings', () => {
    test('should load "start" command', (done) => {
      const originalExit = process.exit;
      const originalCwd = process.cwd();
      process.chdir(path.resolve(
        __dirname,
        '../../../../support/configs/graphQLPluginConfig'
      ));
      const antCli = new AntCli();
      const graphQLPlugin = antCli._ant.pluginController.getPlugin('GraphQL');
      graphQLPlugin.startService = jest.fn();
      process.exit = jest.fn((code) => {
        expect(graphQLPlugin.startService).toHaveBeenCalled();
        expect(code).toEqual(0);
        process.chdir(originalCwd);
        process.exit = originalExit;
        done();
      });
      antCli._yargs.parse('start');
    });

    test('should show friendly errors', (done) => {
      const originalCwd = process.cwd();
      process.chdir(path.resolve(
        __dirname,
        '../../../../support/configs/graphQLPluginConfig'
      ));
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Some start error'
          )
        );
        expect(code).toEqual(1);
        console.error = originalError;
        process.exit = originalExit;
        process.chdir(originalCwd);
        done();
      });
      const antCli = (new AntCli());
      antCli._ant.pluginController.getPlugin('GraphQL')
        .startService = async () => {
          throw new Error('Some start error');
        };
      antCli._yargs.parse('start');
    });

    test('should show friendly error when more passed arguments', (done) => {
      const originalArgv = process.argv;
      process.argv.push('start');
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Start command accepts no arguments'
          )
        );
        expect(code).toEqual(1);
        console.argv = originalArgv;
        console.error = originalError;
        process.exit = originalExit;
        done();
      });
      const graphQL = new GraphQL(ant);
      graphQL._yargsFailed(
        'Unknown argument: configpath',
        {
          handleErrorMessage: (msg, err, command) =>
            (new AntCli())._handleErrorMessage(msg, err, command)
        }
      );
    });

    test('should not change the error message for other cases', () => {
      const originalArgv = process.argv;
      process.argv.push('start');
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn();

      const graphQL = new GraphQL(ant);
      graphQL._yargsFailed(
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

    test('should do nothing if no message if provided', () => {
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn();

      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      new GraphQL(ant)._yargsFailed();
      expect(handleErrorMessage).not.toBeCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();

      console.error = originalError;
      process.exit = originalExit;
    });

    test('should show friendly error when no directive command is provided', async done => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['directive'];
      process.exit = jest.fn((code) => {
        expect(handleErrorMessage).toHaveBeenCalledWith(
          'Directive requires a command', null, 'directive'
        );
        expect(code).toEqual(1);
        done();
      });
      new GraphQL(ant)._yargsFailed('Not enough non-option arguments');
    });

    test('should not show friendly error message when directive command throws unknown error', () => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['directive'];
      new GraphQL(ant)._yargsFailed('Unknown error');
      expect(handleErrorMessage).not.toHaveBeenCalled();
    });

    test('should show friendly error when directive add needs more args', async done => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['directive', 'add'];
      process.exit = jest.fn((code) => {
        expect(handleErrorMessage).toHaveBeenCalledWith(
          'Directive add command requires name, definition and handler arguments',
          null,
          'directive add'
        );
        expect(code).toEqual(1);
        done();
      });
      new GraphQL(ant)._yargsFailed('Not enough non-option arguments');
    });

    test('should not show friendly error message when directive add command throws unknown error', () => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['directive', 'add'];
      new GraphQL(ant)._yargsFailed('Unknown error');
      expect(handleErrorMessage).not.toHaveBeenCalled();
    });

    test('should show friendly error when directive remove needs name arg', async done => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['directive', 'remove'];
      process.exit = jest.fn((code) => {
        expect(handleErrorMessage).toHaveBeenCalledWith(
          'Directive remove command requires name argument',
          null,
          'directive remove'
        );
        expect(code).toEqual(1);
        done();
      });
      new GraphQL(ant)._yargsFailed('Not enough non-option arguments');
    });

    test('should not show friendly error message when directive remove command throws unknown error', () => {
      const handleErrorMessage = jest.spyOn(yargsHelper, 'handleErrorMessage');
      process.argv = ['directive', 'remove'];
      new GraphQL(ant)._yargsFailed('Unknown error');
      expect(handleErrorMessage).not.toHaveBeenCalled();
    });
  });

  describe('GraphQL.directiveController', () => {
    it('should be an instance of DirectiveController and readonly', () => {
      const graphQL = new GraphQL(ant);
      const directiveController = graphQL.directiveController;
      expect(directiveController).toEqual(expect.any(DirectiveController));
      graphQL.directiveController = new DirectiveController(ant);
      expect(directiveController).toEqual(graphQL.directiveController);
    });
  });

  describe(GraphQL.getModel, () => {
    const graphQL = new GraphQL(
      ant,
      {
        basePath: path.resolve(
          __dirname,
          '../../../../support/services/FooService')
      }
    );
    it('should returns the model in the base path', () => {
      expect(graphQL.getModel()).toEqual(expect.stringContaining('schema'));
      expect(graphQL.getModel()).toEqual(expect.stringContaining('helloQuery'));
    });
  });

  describe('static methods', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('GraphQL._getConfig', () => {
      test('should return local configuration instance', () => {
        const configPath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configPath);
        const getLocalConfigPath = jest.spyOn(Config, 'GetLocalConfigPath')
          .mockImplementation(() => configPath);
        const config = GraphQL._getConfig();
        expect(getLocalConfigPath).toHaveBeenCalledWith();
        expect(config).toBeInstanceOf(Config);
      });

      test('should return provided configuration instance', () => {
        const configPath = path.resolve(outPath, 'ant.yml');
        fs.ensureFileSync(configPath);
        fs.writeFileSync(configPath, 'basePath: /foo/bar');
        const config = GraphQL._getConfig(configPath);
        expect(config).toBeInstanceOf(Config);
        expect(config.toString()).toEqual(
          expect.stringContaining('basePath: /foo/bar')
        );
      });
    });
  });

  describe('GraphQL directive commands', () => {
    describe('CLI', () => {
      const originalCwd = process.cwd();
      let antCli;
      let graphQL;

      beforeEach(() => {
        process.chdir(path.resolve(
          __dirname,
          '../../../../support/configs/graphQLPluginConfig'
        ));
        antCli = new AntCli();
        graphQL = antCli
          ._ant
          .pluginController
          .getPlugin('GraphQL');
      });

      afterEach(() => {
        process.chdir(originalCwd);
      });

      test('should invoke addDirective', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });
        graphQL.addDirective = jest.fn(async (name, definition, handler, runtime, config) => {
          expect(name).toBe('myDir');
          expect(definition).toBe('myDefinition');
          expect(handler).toBe('myHandler');
          expect(runtime).toBe('myRuntime');
          expect(config).toBe('myConf');
        });
        antCli._yargs.parse('directive add myDir myDefinition myHandler myRuntime --config myConf');
      });

      test('should invoke removeDirective', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });
        graphQL.removeDirective = jest.fn(async (name, config) => {
          expect(name).toBe('myDir');
          expect(config).toBe('myConf');
        });
        antCli._yargs.parse('directive remove myDir --config myConf');
      });

      test('should invoke listDirectives', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });
        graphQL.listDirectives = jest.fn();
        antCli._yargs.parse('directive ls');
        expect(graphQL.listDirectives).toHaveBeenCalledWith();
      });
    });

    describe('directive add', () => {
      const configPath = path.resolve(outPath, 'ant.yml');

      beforeEach(() => {
        fs.ensureFileSync(configPath);
      });

      test('should add a directive', () => {
        const graphQL = new GraphQL(ant);
        graphQL.addDirective('myDir', 'myDef', 'myHandler', 'myRuntime', configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(`plugins:
  - $GLOBAL/plugins/graphQL:
      directives:
        myDir:
          resolver:
            handler: myHandler
            runtime: myRuntime
          definition: myDef
`);
      });

      test('should add a directive with default runtime', () => {
        const graphQL = new GraphQL(ant);
        graphQL.addDirective('myDir', 'myDef', 'myHandler', undefined, configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(`plugins:
  - $GLOBAL/plugins/graphQL:
      directives:
        myDir:
          resolver:
            handler: myHandler
            runtime: Node
          definition: myDef
`);
      });

      test('should add a directive into a populated file', () => {
        fs.writeFileSync(configPath, `plugins:
  - myPlugin:
      {}`);
        const graphQL = new GraphQL(ant);
        graphQL.addDirective('myDir', 'myDef', 'myHandler', 'myRuntime', configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(`plugins:
  - myPlugin:
      {}
  - $GLOBAL/plugins/graphQL:
      directives:
        myDir:
          resolver:
            handler: myHandler
            runtime: myRuntime
          definition: myDef
`);
      });

      test('should add a directive into a populated file and override plugin config', () => {
        fs.writeFileSync(configPath, `plugins:
  - $GLOBAL/plugins/graphQL`);
        const graphQL = new GraphQL(ant);
        graphQL.addDirective('myDir', 'myDef', 'myHandler', 'myRuntime', configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(`plugins:
  - $GLOBAL/plugins/graphQL:
      directives:
        myDir:
          resolver:
            handler: myHandler
            runtime: myRuntime
          definition: myDef
`);
      });

      test('should override a directive', () => {
        fs.writeFileSync(configPath,`plugins:
  - test
  - $GLOBAL/plugins/graphQL:
      directives:
        myDir:
          resolver:
            handler: /foo/test.js
            runtime: Node
          definition: "directive @test(param: String) on FIELD_DEFINITION"`);
        const graphQL = new GraphQL(ant);
        graphQL.addDirective('myDir', 'myDef', 'myHandler', 'myRuntime', configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(`plugins:
  - test
  - $GLOBAL/plugins/graphQL:
      directives:
        myDir:
          resolver:
            handler: myHandler
            runtime: myRuntime
          definition: myDef
`);
      });
    });

    describe('directive remove', () => {
      const configPath = path.resolve(outPath, 'ant.yml');

      beforeEach(() => {
        fs.ensureFileSync(configPath);
      });

      test('should remove a directive', () => {
        const graphQL = new GraphQL(ant);
        graphQL.addDirective('myDir', 'myDef', 'myHandler', 'myRuntime', configPath);
        graphQL.removeDirective('myDir', configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(`plugins:
  - $GLOBAL/plugins/graphQL:
      directives:
        {}
`);
      });

      test('should remove a directive with additional directives', () => {
        fs.writeFileSync(configPath,`
plugins:
  - $GLOBAL/plugins/graphQL:
      directives:
        test:
          resolver:
            handler: /foo/test.js
            runtime: Node
          definition: "directive @test(param: String) on FIELD_DEFINITION"`);
        const graphQL = new GraphQL(ant);
        graphQL.addDirective('myDir', 'myDef', 'myHandler', 'myRuntime', configPath);
        graphQL.removeDirective('myDir', configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(`plugins:
  - $GLOBAL/plugins/graphQL:
      directives:
        test:
          resolver:
            handler: /foo/test.js
            runtime: Node
          definition: "directive @test(param: String) on FIELD_DEFINITION"
`);
      });

      test('should do nothing because directive does not exists', () => {
        fs.writeFileSync(configPath,`
plugins:
  - $GLOBAL/plugins/graphQL:
      directives:
        test:
          resolver:
            handler: /foo/test.js
            runtime: Node
          definition: "directive @test(param: String) on FIELD_DEFINITION"
`);
        const graphQL = new GraphQL(ant);
        graphQL.removeDirective('myDir', configPath);
      });

      test('should do nothing because GraphQL node does not exists', () => {
        const configFileContent = `plugins:
  - otherPlugin
`;
        fs.writeFileSync(configPath, configFileContent);
        const graphQL = new GraphQL(ant);
        graphQL.removeDirective('myDir', configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(configFileContent);
      });

      test('should do nothing because plugins node does not exists', () => {
        const configFileContent = `templates:
  {}`;
        fs.writeFileSync(configPath, configFileContent);
        const graphQL = new GraphQL(ant);
        graphQL.removeDirective('myDir', configPath);
        const config = fs.readFileSync(configPath, 'utf-8');
        expect(config).toBe(configFileContent);
      });
    });

    describe('directive ls', () => {
      const originalConsoleLog = console.log;

      beforeEach(() => {
        console.log = jest.fn();
      });

      afterEach(() => {
        console.log = originalConsoleLog;
      });

      test('should list all directives', () => {
        const graphQL = new GraphQL(ant);
        graphQL.directiveController.loadDirectives([
          new Directive(ant, 'myDir1', 'myDef1', new AntFunction(ant, 'myFunc1', () => {})),
          new Directive(ant, 'myDir2', 'myDef2', new LibFunction(ant, 'myFunc2', 'myHandler2', new Runtime(ant, 'myRuntime2', 'myBin2', ['foo'])))
        ]);
        graphQL.listDirectives();
        expect(console.log).toHaveBeenCalledTimes(3);
        expect(console.log.mock.calls[0][0]).toBe('Listing all directives available (<name> <definition> [resolver]):');
        expect(console.log.mock.calls[1][0]).toBe('myDir1 myDef1');
        expect(console.log.mock.calls[2][0]).toBe('myDir2 myDef2 myHandler2');
      });
    });
  });
});
