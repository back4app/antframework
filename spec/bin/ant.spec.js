/* eslint-disable no-console */

/**
 * @fileoverview Tests for bin/ant.js file.
 */

const path = require('path');
const fs = require('fs-extra');
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const AntCli = require('../../lib/cli/AntCli');

const binPath = path.resolve(__dirname, '../../bin/ant.js');

/**
 * Helper function to run the CLI command with args and check the expected
 * usage instructions as an output.
 * @param {string} args The args to be sent to the CLI command.
 * @async
 * @private
 */
async function _expectUsageInstructions(args) {
  const { stdout, stderr } = await exec(
    `${binPath}${args ? ` ${args}` : ''}`
  );
  expect(stdout).not.toBeNull();
  expect(stdout.split('\n')[0]).toEqual(
    'Usage: ant.js [--help] [--version] [--config <path>] [--verbose] <command>'
  );
  expect(stdout).toContain(
    `Usage: ant.js [--help] [--version] [--config <path>] [--verbose] <command>
[<args>] [<options>]`
  );
  expect(stdout).toContain(`Commands:
  ant.js create <service> [--template       Create a new service
  <name>]`);
  expect(stdout).toContain(
    '--help, -h     Show help                                             [boolean]'
  );
  expect(stdout).toContain(
    '--version      Show version number                                   [boolean]'
  );
  expect(stdout).toContain(
    '--config, -c   Path to YAML config file'
  );
  expect(stdout).toContain(
    '--verbose, -v  Show execution logs and error stacks [boolean] [default: false]'
  );
  expect(stdout).toContain(`Plugins:
  Core`);
  expect(stdout).toContain(
    'For more information, visit https://github.com/back4app/antframework'
  );
  expect(stderr).toEqual('');
}

/**
 * Helper function to run the CLI command with args and check the expected error
 * messages as an output.
 * @param {string} args The args to be sent to the CLI command.
 * @param {string} errorMessages The expected error messages.
 * @async
 * @private
 */
async function _expectErrorMessage(args, ...errorMessages) {
  expect.hasAssertions();
  try {
    await exec(
      `${binPath}${args ? ` ${args}` : ''}`
    );
    throw new Error('It is expected to throw some error');
  } catch (e) {
    const { code, stdout, stderr } = e;
    expect(code).toEqual(1);
    expect(stdout).toEqual('');
    for(const errorMessage of errorMessages) {
      expect(stderr).toContain(errorMessage);
    }
  }
}

/**
 * Helper function to run the CLI command with args and check the expected CLI
 * success message.
 * @param {String} args The args to be sent to the CLI command.
 * @param {String|Array<String>} successMessages The expected success messages.
 * @async
 * @private
 */
async function _expectSuccessMessage(args, ...successMessages) {
  const { stdout, stderr } = await exec(`${binPath}${args ? ` ${args}` : ''}`);
  for (const successMessage of successMessages) {
    expect(stdout).toContain(successMessage);
  }
  expect(stderr).toEqual('');
}

/**
 * Helper function to run the CLI command with args and check the expected CLI
 * version.
 * @param {string} args The args to be sent to the CLI command.
 * @async
 * @private
 */
async function _expectPackageVersion(args) {
  const packageVersion = require(
    path.resolve(__dirname, '../../package.json')
  ).version;
  await _expectSuccessMessage(args, `${packageVersion}\n`);
}

describe('bin/ant.js', () => {
  const originalCwd = process.cwd();
  const outPath = path.resolve(
    __dirname,
    '../support/out/bin/ant.js',
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

  test(
    'should print usage instructions when called with no commands nor options',
    () => _expectUsageInstructions(null)
  );

  test(
    'should print usage instructions when called with no commands but options',
    () => _expectUsageInstructions('--foo')
  );

  test('should load local config', async () => {
    const { stdout, stderr } = await exec(
      binPath,
      { cwd: path.resolve(__dirname, '../support/configs/fooPluginConfig')}
    );
    expect(stdout).not.toBeNull();
    expect(stdout).toContain('Plugins:');
    expect(stdout).toContain('FooPlugin');
    expect(stderr).toEqual('');
  });

  test('should print plugin load error', async () => {
    const { stdout, stderr } = await exec(
      binPath,
      { cwd: path.resolve(__dirname, '../support/configs/notAPluginConfig')}
    );
    expect(stdout).not.toBeNull();
    expect(stdout).toContain(
      'There were some errors when loading the plugins:'
    );
    expect(stdout).toContain('Could not load plugin module');
    expect(stderr).toEqual('');
  });

  test(
    'should print error when calling with an inexistent command',
    () => _expectErrorMessage('foo', `Fatal => Unknown command: foo

For getting help:
ant.js --help [command]`)
  );

  test(
    'should print error when calling with more than one command',
    () => _expectErrorMessage(
      'cmd1 cmd2',
      `Fatal => You can run only one command per call

For getting help:
ant.js --help [command]`
    )
  );

  test(
    'should recommend commands',
    () => _expectErrorMessage(
      'creat',
      `Fatal => Did you mean create?

For getting help:
ant.js --help [command]`
    )
  );

  test('should have --help option', () => _expectUsageInstructions('--help'));

  test('should have -h alias', () => _expectUsageInstructions('-h'));

  test(
    'should print help with any command',
    () => _expectUsageInstructions('-h foo')
  );

  test(
    'should print package.json version when calling --version option',
    () => _expectPackageVersion('--version')
  );

  test(
    'should print version with any command',
    () => _expectPackageVersion('--version foo')
  );

  test('should have --verbose option', () => _expectUsageInstructions('--verbose'));

  test('should have -v alias', () => _expectUsageInstructions('-v'));

  describe('Core plugin', () => {
    describe('create command', () => {
      test(
        'should work only with "service" arg',
        () => _expectSuccessMessage('create MyService', '')
      );

      test(
        'should work with "service" arg and "--template" option',
        () => _expectSuccessMessage(
          'create MyService --template Default',
          'Service "MyService" successfully created'
        )
      );

      test(
        'should print command help',
        () => _expectSuccessMessage(
          '--help create',
          `ant.js create <service> [--template <name>]

Create a new service

Options:
  --help, -h      Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  --config, -c    Path to YAML config file
  --verbose, -v   Show execution logs and error stacks[boolean] [default: false]
  --template, -t  Specify the template for the new service
                                                   [string] [default: "Default"]
`
        )
      );

      test(
        'should fail without "service" arg',
        () => _expectErrorMessage('create', `Fatal => Create command requires service argument

For getting help:
ant.js --help create`)
      );

      test(
        'should fail with too many args',
        () => _expectErrorMessage(
          'create MyService foo',
          `Fatal => Create command only accepts 1 argument

For getting help:
ant.js --help create`
        )
      );

      test(
        'should fail without template name',
        () => _expectErrorMessage(
          'create MyService --template',
          `Fatal => Template option requires name argument

For getting help:
ant.js --help create`)
      );

      test(
        'should use "Default" template name without --template option',
        (done) => {
          const originalExit = process.exit;
          process.exit = jest.fn();
          process.exit = jest.fn(() => {
            process.exit = originalExit;
            expect.hasAssertions();
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .createService = jest.fn(async (name, template) => {
              expect(name).toEqual('MyService');
              expect(template).toEqual('Default');
            });
          antCli._yargs.parse('create MyService');
        }
      );
    });

    describe('plugin install command', () => {
      test(
        'should work only with "plugin" arg',
        (done) => {
          const originalExit = process.exit;
          process.exit = jest.fn(() => {
            process.exit = originalExit;
            expect.hasAssertions();
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .installPlugin = jest.fn(async (plugin, isGlobal) => {
              expect(plugin).toEqual('MyPlugin');
              expect(isGlobal).toEqual(false);
              done();
            });
          antCli._yargs.parse('plugin install MyPlugin');
        }
      );

      test(
        'should not work without "plugin" arg',
        () => _expectErrorMessage('plugin install',
          `Fatal => Plugin install command requires plugin argument

For getting help:
ant.js --help plugin install`)
      );

      test(
        'should work with "plugin" arg and "--global" or "-g" option',
        (done) => {
          const originalExit = process.exit;
          process.exit = jest.fn(() => {
            process.exit = originalExit;
            expect.hasAssertions();
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .installPlugin = jest.fn(async (plugin, isGlobal) => {
              expect(plugin).toEqual('MyPlugin');
              expect(isGlobal).toEqual(true);
            });
          antCli._yargs.parse('plugin install MyPlugin --global');
        }
      );

      test(
        'should print command help',
        () => _expectSuccessMessage(
          '--help plugin install',
          'ant.js plugin install <plugin> [--global]',
          'Installs new plugin',
          'plugin  The plugin to be installed                                  [required]',
          `--global, -g   Installs plugin into global configuration file
                                                      [boolean] [default: false]`
        )
      );

      test(
        'should handle installPlugin error',
        (done) => {
          const originalExit = process.exit;
          const originalError = console.error;
          console.error = jest.fn();
          process.exit = jest.fn(() => {
            expect(console.error).toBeCalledWith(
              expect.stringContaining('Mocked error')
            );
            process.exit = originalExit;
            console.error = originalError;
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .installPlugin = jest.fn(async () => {
              throw Error('Mocked error');
            });
          antCli._yargs.parse('plugin install MyPlugin');
        }
      );
    });

    describe('plugin remove command', () => {
      test(
        'should work only with "plugin" arg',
        (done) => {
          const originalExit = process.exit;
          process.exit = jest.fn(() => {
            process.exit = originalExit;
            expect.hasAssertions();
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .removePlugin = jest.fn(async (plugin, isGlobal) => {
              expect(plugin).toEqual('MyPlugin');
              expect(isGlobal).toEqual(false);
              done();
            });
          antCli._yargs.parse('plugin remove MyPlugin');
        }
      );

      test(
        'should not work without "plugin" arg',
        () => _expectErrorMessage('plugin remove',
          'Fatal => Plugin remove command requires plugin argument',
          'ant.js --help plugin remove')
      );

      test(
        'should work with "plugin" arg and "--global" or "-g" option',
        (done) => {
          const originalExit = process.exit;
          process.exit = jest.fn(() => {
            process.exit = originalExit;
            expect.hasAssertions();
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .removePlugin = jest.fn(async (plugin, isGlobal) => {
              expect(plugin).toEqual('MyPlugin');
              expect(isGlobal).toEqual(true);
            });
          antCli._yargs.parse('plugin remove MyPlugin --global');
        }
      );

      test(
        'should print command help',
        () => _expectSuccessMessage(
          '--help plugin remove',
          'ant.js plugin remove <plugin> [--global]',
          'Removes a plugin',
          'plugin  The plugin to be removed                                    [required]',
          `--global, -g   Removes plugin from global configuration file
                                                      [boolean] [default: false]`
        )
      );

      test(
        'should handle removePlugin error',
        (done) => {
          const originalExit = process.exit;
          const originalError = console.error;
          console.error = jest.fn();
          process.exit = jest.fn(() => {
            expect(console.error).toBeCalledWith(
              expect.stringContaining('Mocked error')
            );
            process.exit = originalExit;
            console.error = originalError;
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .removePlugin = jest.fn(async () => {
              throw Error('Mocked error');
            });
          antCli._yargs.parse('plugin remove MyPlugin');
        }
      );
    });
  });

  describe('GraphQL plugin', () => {
    describe('start command', () => {
      const originalCwd = process.cwd();
      const graphQlPluginConfigPath = path.resolve(
        __dirname,
        '../support/configs/graphQLPluginConfig'
      );

      beforeEach(() => {
        process.chdir(graphQlPluginConfigPath);
      });

      afterEach(() => {
        process.chdir(originalCwd);
      });

      test(
        'should work with no args',
        (done) => {
          const cliProcess = childProcess.spawn(
            `${binPath}`,
            ['start'],
            { cwd: graphQlPluginConfigPath, detached: true }
          );
          cliProcess.stdout.on('data', data => {
            data = data.toString();
            if (
              data.includes('GraphQL API server listening for requests')
            ) {
              process.kill(-cliProcess.pid);
              done();
            }
          });
        }
      );

      test(
        'should print command help',
        () => _expectSuccessMessage(
          '--help start',
          `ant.js start [--config <path>]

Start a service in localhost

Options:
  --help, -h     Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  --config, -c   Path to YAML config file
  --verbose, -v  Show execution logs and error stacks [boolean] [default: false]
`
        )
      );

      test(
        'should fail with too many args',
        () => _expectErrorMessage(
          'start foo',
          `Fatal => Start command accepts no arguments

For getting help:
ant.js --help start`
        )
      );
    });
  });
});
