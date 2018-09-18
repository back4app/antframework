/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/plugins/graphQL/lib/GraphQL.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const childProcess = require('child_process');
const Ant = require('../../../../../lib/Ant');
const AntCli = require('../../../../../lib/cli/AntCli');
const Plugin = require('../../../../../lib/plugins/Plugin');
const GraphQL = require('../../../../../lib/plugins/graphQL/lib/GraphQL');
const Directive = require(
  '../../../../../lib/plugins/graphQL/lib/directives/Directive'
);
const DirectiveController = require(
  '../../../../../lib/plugins/graphQL/lib/directives/DirectiveController'
);

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

  describe('GraphQL.getModel', () => {
    test('should get model from plugin config.basePath', () => {
      const modelFile = 'myModel.graphql';
      const modelPath = path.resolve(outPath, modelFile);
      const graphQL = new GraphQL(new Ant(), { basePath: outPath, model: modelFile });
      fs.ensureFileSync(modelPath);
      fs.writeFileSync(modelPath, 'from ant.config.basePath');
      const model = graphQL.getModel();
      expect(model).toBe('from ant.config.basePath');
    });

    test('should get model from ant config.basePath', () => {
      const modelFile = 'myModel.graphql';
      const modelPath = path.resolve(outPath, modelFile);
      fs.ensureFileSync(modelPath);
      fs.writeFileSync(modelPath, 'from config.basePath');
      const graphQL = new GraphQL(new Ant({ basePath: outPath }), { model: modelFile });
      const model = graphQL.getModel();
      expect(model).toBe('from config.basePath');
    });

    test('should get model from process.cwd', () => {
      const originalCwd = process.cwd();
      process.chdir(outPath);
      const modelFile = 'myModel.graphql';
      const modelPath = path.resolve(process.cwd(), modelFile);
      fs.writeFileSync(modelPath, 'from process.cwd');
      try {
        const graphQL = new GraphQL(new Ant(), { model: modelFile });
        const model = graphQL.getModel();
        expect(model).toBe('from process.cwd');
      } finally {
        process.chdir(originalCwd);
      }
    });
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
});
