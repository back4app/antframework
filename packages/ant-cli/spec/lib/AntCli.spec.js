/* eslint-disable no-console */

/**
 * @fileoverview Tests for lib/AntCli.js file.
 */

const path = require('path');
const fs = require('fs');
const YError = require('yargs/lib/yerror');
const { AntError, logger } = require('@back4app/ant-util');
const { Ant } = require('@back4app/ant');
const AntCli = require('../../lib/AntCli');
const yargs = require('yargs');
const { yargsHelper } = require('@back4app/ant-util-yargs');
const { Analytics } = require('@back4app/ant-util-analytics');

const utilPath = fs.realpathSync(path.resolve(
  __dirname,
  '../../node_modules/@back4app/ant-util-tests'
));

describe('lib/AntCli.js', () => {
  beforeEach(() => {
    yargs.resetOptions();
    yargsHelper._resetHandler();
  });

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
      utilPath,
      'configs/fooPluginConfig'
    ));
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).toContain('FooPlugin');
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
    process.argv = ['--config'];
    process.argv.push(path.resolve(
      utilPath,
      'configs/fooPluginConfig/ant.yml'
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
      expect(console.log.mock.calls[0][0]).toContain('FooPlugin');
    } catch (e) {
      throw e;
    } finally {
      process.argv = originalArgv;
      process.exit = originalExit;
      process.chdir(originalCwd);
      console.log = originalLog;
    }
  });

  test('should run with --config option', () => {
    const originalArgv = process.argv;
    process.argv = ['--version', '--config'];
    const configPath = path.resolve(
      utilPath,
      'configs/fooPluginConfig/ant.yml'
    );
    process.argv.push(configPath);
    const originalExit = process.exit;
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(__dirname);
    process.exit = jest.fn();
    try {
      (new AntCli())._yargs.parse(`--version --config ${configPath}`);
      expect(process.exit).toHaveBeenCalledWith(0);
    } catch (e) {
      throw e;
    } finally {
      process.argv = originalArgv;
      process.exit = originalExit;
      process.chdir(originalCwd);
      console.log = originalLog;
    }
  });

  test('should fail with --config and no args', () => {
    const handlerMock = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementation((msg, err) => {
      expect(msg).toBe('Config option requires path argument');
      expect(err).toBeInstanceOf(AntError);
    });
    const originalArgv = process.argv;
    try {
      process.argv = ['--config'];
      new AntCli();
      expect.hasAssertions();
    } catch (err) {
      throw err;
    } finally {
      handlerMock.mockRestore();
      process.argv = originalArgv;
    }
  });

  test('should work with no plugins', () => {
    const originalGetGlobalConfig = Ant.prototype._getGlobalConfig;
    jest.spyOn(Ant.prototype, '_getGlobalConfig').mockImplementation(() => {
      return {};
    });
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
      Ant.prototype._getGlobalConfig = originalGetGlobalConfig;
      process.exit = originalExit;
      console.log = originalLog;
    }
  });

  test('should load config with no plugins', () => {
    const originalArgv = process.argv;
    process.argv = ['--config', 'ant.yml'];
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    const currentDir = path.resolve(
      utilPath,
      'configs/noPluginsConfig'
    );
    process.chdir(currentDir);
    const originalWriteFileSync = fs.writeFileSync;
    fs.writeFileSync = jest.fn();
    try {
      (new AntCli())._yargs.parse('--config ant.yml');
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
      process.argv = originalArgv;
      fs.writeFileSync = originalWriteFileSync;
    }
  });

  test('should not load invalid config', () => {
    const configPath = path.resolve(utilPath, 'configs/invalidConfig');
    const handlerMock = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementation((msg, err) => {
      expect(msg).toBe(`Could not load config ${configPath}/ant.yml`);
      expect(err).toBeInstanceOf(AntError);
    });
    const addBreadcrumbMock = jest.spyOn(Analytics, 'addBreadcrumb');
    const originalCwd = process.cwd();
    process.chdir(configPath);
    try {
      const cli = new AntCli();
      expect(cli._yargs).toBeUndefined();
      cli.execute();
      expect(addBreadcrumbMock).not.toBeCalled();
    } catch (err) {
      throw err;
    } finally  {
      handlerMock.mockRestore();
      process.chdir(originalCwd);
    }
  });

  test('should not execute due to error when loading config', () => {
    const getConfigMock = jest.spyOn(AntCli.prototype, '_getAntConfig').mockImplementation(() => {
      throw new Error('Mocked error');
    });
    const handlerMock = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementation(msg => {
      expect(msg).toBe('Mocked error');
    });
    const addBreadcrumbMock = jest.spyOn(Analytics, 'addBreadcrumb');
    try {
      const cli = new AntCli();
      expect(cli._yargs).toBeUndefined();
      cli.execute();
      expect(addBreadcrumbMock).not.toBeCalled();
    } catch (err) {
      throw err;
    } finally  {
      getConfigMock.mockRestore();
      handlerMock.mockRestore();
      addBreadcrumbMock.mockRestore();
    }
  });

  test('should show verbose message when not using --verbose option', () => {
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      utilPath,
      'configs/notAPluginConfig'
    ));
    try {
      (new AntCli()).execute();
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(console.log.mock.calls[0][0]).toContain(
        'For getting the error stack, use --verbose option'
      );
    } catch (e) {
      throw e;
    } finally {
      process.exit = originalExit;
      console.log = originalLog;
      process.chdir(originalCwd);
    }
  });

  test('should show stack when using --verbose option', () => {
    const originalArgv = process.argv;
    process.argv = ['--verbose'];
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      utilPath,
      'configs/notAPluginConfig'
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
    process.argv = ['-v'];
    const originalExit = process.exit;
    process.exit = jest.fn();
    const originalLog = console.log;
    console.log = jest.fn();
    const originalCwd = process.cwd();
    process.chdir(path.resolve(
      utilPath,
      'configs/notAPluginConfig'
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
      const handlerMock = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementation((msg, err) => {
        expect(msg).toBe('Unknown command: bar');
        expect(err).toBeUndefined();
      });
      try {
        (new AntCli())._yargs.parse('bar');
        expect.hasAssertions();
      } catch (err) {
        throw err;
      } finally {
        handlerMock.mockRestore();
      }
    }
  );

  test(
    'should suggest commands',
    () => {
      const trackErrorMock = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementationOnce((msg, err) => {
        expect(msg).toBe('Did you mean create?');
        expect(err).toBeUndefined();
        yargsHelper.setErrorHandled();
      });
      try {
        (new AntCli())._yargs.parse('creat');
        expect.hasAssertions();
      } catch (err) {
        throw err;
      } finally {
        trackErrorMock.mockRestore();
      }
    }
  );

  test(
    'should throw error when something goes wrong',
    () => {
      const handlerMock = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementation((msg, err, command) => {
        expect(msg).toBe('Something went wrong');
        expect(err).toBeInstanceOf(YError);
        expect(err.message).toBe('Something went wrong');
        expect(command).toBeUndefined();
      });
      try {
        (new AntCli())._yargs.command(
          'foo',
          'foo description',
          () => {},
          () => { throw new YError('Something went wrong'); }
        ).parse('foo');
        expect.hasAssertions();
      } catch (err) {
        throw err;
      } finally {
        handlerMock.mockRestore();
      }
    }
  );

  test(
    'should throw friendly error when not passing required arg to option',
    () => {
      const commandErr = new YError('Not enough arguments following: ');
      const handlerMock = jest.spyOn(yargsHelper, 'handleErrorMessage').mockImplementation((msg, err) => {
        expect(msg).toBe('Not enough arguments following: ');
        expect(err).toBe(commandErr);
      });
      try {
        (new AntCli())._yargs.command(
          'foo',
          'foo description',
          { option: { requiresArg: true }},
          () => { throw commandErr; }
        ).parse('foo');
      } catch (err) {
        throw err;
      } finally {
        handlerMock.mockRestore();
      }
    }
  );

  test(
    'should attach console.log to logger handlers when using --verbose option',
    () => {
      const originalArgv = process.argv;
      process.argv = ['foo', '--verbose'];
      const attachHandlerMock = jest.spyOn(logger, 'attachHandler');
      const attachErrorHandlerMock = jest.spyOn(logger, 'attachErrorHandler');
      try {
        new AntCli()._yargs.command(
          'foo',
          'foo description',
          { option: { requiresArg: true }},
          () => {}
        ).parse('foo --verbose');
        expect(attachHandlerMock).toHaveBeenCalledWith(console.log);
        expect(attachErrorHandlerMock).toHaveBeenCalledWith(console.error);
      } catch (err) {
        throw err;
      } finally {
        attachHandlerMock.mockRestore();
        attachErrorHandlerMock.mockRestore();
        process.argv = originalArgv;
      }
    }
  );

  test('should load base path', () => {
    const originalCwd = process.cwd();
    const currentDir = path.resolve(utilPath, 'configs/basePathConfig');
    process.chdir(currentDir);
    const antCli = new AntCli();
    const basePath = path.resolve(currentDir, '../../');
    expect(antCli._ant._config.basePath).toEqual(basePath);
    expect(antCli._ant._config.plugins).toEqual(expect.any(Array));
    expect(antCli._ant._config.plugins).toHaveLength(1);
    expect(antCli._ant._config.plugins[0]).toEqual(
      path.resolve(basePath, './plugins/FooPlugin.js')
    );
    expect(antCli._ant.pluginController.plugins).toEqual(expect.any(Array));
    expect(antCli._ant.pluginController.plugins).toHaveLength(2);
    expect(antCli._ant.pluginController.plugins[0].name).toEqual('Core');
    expect(antCli._ant.pluginController.plugins[1].name).toEqual('FooPlugin');
    process.chdir(originalCwd);
  });
});
