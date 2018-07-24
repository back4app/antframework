/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/cli/AntCli.js file.
 */

const path = require('path');
const yaml = require('js-yaml');
const YError = require('yargs/lib/yerror');
const AntCli = require('../../../lib/cli/AntCli');
const logger = require('../../../lib/util/logger');

describe('lib/cli/AntCli.js', () => {
  test('should export "AntCli" class with "execute" method', () => {
    const antCli = new AntCli();
    expect(antCli.constructor.name).toEqual('AntCli');
    expect(antCli.execute).toEqual(expect.any(Function));
  });

  test('should load global config', () => {
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).toContain('  Core');
    } catch (e) {
      throw e;
    } finally {
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('should load custom config', () => {
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../support/configs/notAPluginConfig'
    ));
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).toContain('NotAPlugin');
    } catch (e) {
      throw e;
    } finally {
      process.exit = originalExit;
      console.log = originalLog;
      process.chdir(originalCwd);
    }
  });

  test('should load custom config with --config option', () => {
    const originalArgv = process.argv;
    process.argv = [];
    process.argv.push('--config');
    process.argv.push(path.resolve(
      __dirname,
      '../../support/configs/notAPluginConfig/ant.yml'
    ));
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(__dirname);
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).toContain('NotAPlugin');
    } catch (e) {
      throw e;
    } finally {
      process.argv = originalArgv;
      process.exit = originalExit;
      process.chdir(originalCwd);
      console.log = originalLog;
    }
  });

  test('should run with --config option', (done) => {
    expect.hasAssertions();
    const originalArgv = process.argv;
    process.argv = [];
    process.argv.push('--version');
    process.argv.push('--config');
    const configPath = path.resolve(
      __dirname,
      '../../support/configs/fooPluginConfig/ant.yml'
    );
    process.argv.push(configPath);
    const originalExit = process.exit;
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(__dirname);
    process.exit = jest.fn(code => {
      expect(code).toEqual(0);
      process.argv = originalArgv;
      process.exit = originalExit;
      process.chdir(originalCwd);
      console.log = originalLog;
      done();
    });
    (new AntCli())._yargs.parse(`--version --config ${configPath}`);
  });

  test('should fail with --config and no args', () => {
    const originalArgv = process.argv;
    process.argv = [];
    process.argv.push('--config');
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalError = console.error;
    console.error = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(__dirname);
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error.mock.calls[0][0]).toContain(
        'Config option requires path argument'
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

  test('should work with no plugins', () => {
    const originalSafeLoad = yaml.safeLoad;
    yaml.safeLoad = () => null;
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).not.toContain('Plugins:');
    } catch (e) {
      throw e;
    } finally {
      yaml.safeLoad = originalSafeLoad;
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('should load config with no plugins', () => {
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../support/configs/noPluginsConfig'
    ));
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).toContain(`Plugins:
  Core
`);
    } catch (e) {
      throw e;
    } finally {
      process.exit = originalExit;
      console.log = originalLog;
      process.chdir(originalCwd);
    }
  });

  test('should not load invalid config', () => {
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalError = console.error;
    console.error = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../support/configs/invalidConfig'
    ));
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.error.mock.calls[0][0]).toContain(
        'Could not load config'
      );
    } catch (e) {
      throw e;
    } finally {
      process.exit = originalExit;
      console.log = originalLog;
      console.error = originalError;
      process.chdir(originalCwd);
    }
  });

  test('should show stack when using --verbose option', () => {
    const originalArgv = process.argv;
    process.argv.push('--verbose');
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../support/configs/notAPluginConfig'
    ));
    try {
      (new AntCli())._yargs.parse('--verbose');
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).toContain(
        'at PluginController._loadPlugin'
      );
    } catch (e) {
      throw e;
    } finally {
      process.argv = originalArgv;
      process.exit = originalExit;
      console.log = originalLog;
      process.chdir(originalCwd);
    }
  });

  test('should show stack when using -v option', () => {
    const originalArgv = process.argv;
    process.argv.push('-v');
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      __dirname,
      '../../support/configs/notAPluginConfig'
    ));
    try {
      (new AntCli())._yargs.parse('-v');
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).toContain(
        'at PluginController._loadPlugin'
      );
    } catch (e) {
      throw e;
    } finally {
      process.argv = originalArgv;
      process.exit = originalExit;
      console.log = originalLog;
      process.chdir(originalCwd);
    }
  });

  test(
    'should print error when calling with an inexistent command',
    () => {
      const originalExit = process.exit;
      process.exit = jest.fn();
      const originalError = console.error;
      console.error = jest.fn();
      try {
        (new AntCli())._yargs.parse('foo');
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error.mock.calls[0][0]).toContain(
          'Fatal => Unknown command: foo'
        );
      } catch (e) {
        throw e;
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }
    }
  );

  test(
    'should suggest commands',
    () => {
      const originalExit = process.exit;
      process.exit = jest.fn();
      const originalError = console.error;
      console.error = jest.fn();
      try {
        (new AntCli())._yargs.parse('creat');
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error.mock.calls[0][0]).toContain(
          'Fatal => Did you mean create?'
        );
      } catch (e) {
        throw e;
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }
    }
  );

  test(
    'should throw error when something goes wrong',
    () => {
      expect(() => (new AntCli())._yargs.command(
        'foo',
        'foo description',
        () => {},
        () => { throw new YError('Something went wrong'); }
      ).parse('foo')).toThrowError('Something went wrong');
    }
  );

  test(
    'should throw friendly error when not passing required arg to option',
    () => {
      const originalExit = process.exit;
      process.exit = jest.fn();
      const originalError = console.error;
      console.error = jest.fn();
      try {
        (new AntCli())._yargs.command(
          'foo',
          'foo description',
          { option: { requiresArg: true }},
          () => { throw new YError('Not enough arguments following: '); }
        ).parse('foo');
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error.mock.calls[0][0]).toContain(
          'Not enough arguments following: '
        );
      } catch (e) {
        throw e;
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }
    }
  );

  test(
    'should attach console.log to logger handlers when using --verbose option',
    () => {
      expect.hasAssertions();
      const originalExit = process.exit;
      process.exit = jest.fn();
      const originalError = console.error;
      console.error = jest.fn();
      try {
        (new AntCli())._yargs.parse('foo --verbose');
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(logger._handlers).toEqual(expect.any(Set));
        expect(logger._handlers.size).toEqual(1);
        expect(Array.from(logger._handlers.values())[0]).toEqual(console.log);
      } catch (e) {
        throw e;
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }
    }
  );
});
