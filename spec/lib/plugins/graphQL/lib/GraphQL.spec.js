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

  test('should export "GraphQL" class extending "Plugin" class', async () => {
    const graphQL = new GraphQL(ant);
    expect(graphQL.constructor.name).toEqual('GraphQL');
    expect(graphQL).toBeInstanceOf(Plugin);
    expect(graphQL.name).toEqual('GraphQL');
    await graphQL.startService();
  });

  test('should fail if invalid server', () => {
    const graphQL = new GraphQL(ant, { server: '/foo/server' });
    expect(graphQL.startService()).rejects.toThrow('Could not start server');
  });

  describe('GraphQL.loadYargsSettings', () => {
    test('should load "start" command', (done) => {
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
          expect.stringContaining('Service started...')
        );
        expect(code).toEqual(0);
        console.log = originalLog;
        process.exit = originalExit;
        process.chdir(originalCwd);
        done();
      });
      (new AntCli())._yargs.parse('start');
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
      antCli._ant.pluginController.getPlugin('GraphQL').start = async () => {
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
});
