/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/plugins/graphQL/lib/GraphQL.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const Ant = require('../../../../../lib/Ant');
const AntCli = require('../../../../../lib/cli/AntCli');
const Plugin = require('../../../../../lib/plugins/Plugin');
const GraphQL = require('../../../../../lib/plugins/graphql/lib/GraphQL');

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

  test('should export "GraphQL" class extending "Plugin" class', () => {
    const graphQL = new GraphQL(ant);
    expect(graphQL.constructor.name).toEqual('GraphQL');
    expect(graphQL).toBeInstanceOf(Plugin);
    expect(graphQL.name).toEqual('GraphQL');
  });

  describe('GraphQL.loadYargsSettings', () => {
    test('should load "run" command', (done) => {
      const originalCwd = process.cwd();
      process.chdir(path.resolve(
        __dirname,
        '../../../../support/configs/graphQLPluginConfig'
      ));
      const originalLog = console.log;
      console.log = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Service running...')
        );
        expect(code).toEqual(0);
        console.log = originalLog;
        process.exit = originalExit;
        process.chdir(originalCwd);
        done();
      });
      (new AntCli())._yargs.parse('run');
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
            'Some run error'
          )
        );
        expect(code).toEqual(1);
        console.error = originalError;
        process.exit = originalExit;
        process.chdir(originalCwd);
        done();
      });
      const antCli = (new AntCli());
      antCli._ant.pluginController.getPlugin('GraphQL').run = () => {
        throw new Error('Some run error');
      };
      antCli._yargs.parse('run');
    });

    test('should not change the error if not the run command in argv', () => {
      const originalArgv = process.argv;
      process.argv = [];
      const originalExit = process.exit;
      process.exit = jest.fn();
      const originalLog = console.log;
      console.log = jest.fn();
      const originalError = console.error;
      console.error = jest.fn();
      const originalCwd = process.cwd();
      process.chdir(path.resolve(
        __dirname,
        '../../../../support/configs/graphQLPluginConfig'
      ));
      try {
        (new AntCli())._yargs.parse('run foo');
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error.mock.calls[0][0]).toContain(
          'Fatal => Unknown command: configpath'
        );
      } catch (e) {
        throw e;
      } finally {
        process.argv = originalArgv;
        process.exit = originalExit;
        process.chdir(originalCwd);
        console.log = originalLog;
        console.error = originalError;
      }
    });

    test('should show friendly error when more passed arguments', (done) => {
      const originalArgv = process.argv;
      process.argv.push('run');
      const originalError = console.error;
      console.error = jest.fn();
      const originalExit = process.exit;
      process.exit = jest.fn((code) => {
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Run command accepts no arguments'
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
      process.argv.push('run');
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
});
