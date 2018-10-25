/* eslint-disable no-console */

/**
 * @fileoverview Tests for bin/ant.js file.
 */

const util = require('util');
const path = require('path');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const fs = require('fs-extra');
const rx = require('rxjs');
const { yargsHelper } = require('@back4app/ant-util-yargs');
const AntCli = require('../../lib/AntCli');

const binPath = path.resolve(__dirname, '../../bin/ant.js');

const utilPath = path.resolve(
  __dirname,
  '../../node_modules/@back4app/ant-util-tests'
);

const getAntCommand = args => `${binPath}${args ? ` ${args}` : ''} --no-tracking`;

/**
 * Helper function to run the CLI command with args and check the expected
 * usage instructions as an output.
 * @param {string} args The args to be sent to the CLI command.
 * @async
 * @private
 */
async function _expectUsageInstructions(args) {
  const { stdout, stderr } = await exec(getAntCommand(args));
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
  <template>]`);
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
    await exec(getAntCommand(args));
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
  const { stdout, stderr } = await exec(getAntCommand(args));
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
      getAntCommand(),
      { cwd: path.resolve(utilPath, './configs/fooPluginConfig')}
    );
    expect(stdout).not.toBeNull();
    expect(stdout).toContain('Plugins:');
    expect(stdout).toContain('FooPlugin');
    expect(stderr).toEqual('');
  });

  test('should print plugin load error', async () => {
    const { stdout, stderr } = await exec(
      getAntCommand(),
      { cwd: path.resolve(utilPath, './configs/notAPluginConfig')}
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
          `ant.js create <service> [--template <template>]

Create a new service

Options:
  --help, -h      Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  --config, -c    Path to YAML config file
  --verbose, -v   Show execution logs and error stacks[boolean] [default: false]
  --template, -t  Specify the template name or template files path for the new
                  service                          [string] [default: "Default"]
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

    describe('plugin add command', () => {
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
            .addPlugin = jest.fn(async (plugin, isGlobal) => {
              expect(plugin).toEqual('MyPlugin');
              expect(isGlobal).toEqual(false);
              done();
            });
          antCli._yargs.parse('plugin add MyPlugin');
        }
      );

      test(
        'should not work without "plugin" arg',
        () => _expectErrorMessage('plugin add',
          `Fatal => Plugin add command requires plugin argument

For getting help:
ant.js --help plugin add`)
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
            .addPlugin = jest.fn(async (plugin, isGlobal) => {
              expect(plugin).toEqual('MyPlugin');
              expect(isGlobal).toEqual(true);
            });
          antCli._yargs.parse('plugin add MyPlugin --global');
        }
      );

      test(
        'should print command help',
        () => _expectSuccessMessage(
          '--help plugin add',
          'ant.js plugin add <plugin> [--global]',
          'Adds new plugin',
          'plugin  The plugin to be added                                      [required]',
          `--global, -g   Adds plugin into global configuration file
                                                      [boolean] [default: false]`
        )
      );

      test(
        'should handle addPlugin error',
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
            .addPlugin = jest.fn(async () => {
              throw Error('Mocked error');
            });
          antCli._yargs.parse('plugin add MyPlugin');
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

    describe('template add command', () => {
      test(
        'should work only with "category", template" and "path" args',
        (done) => {
          const originalExit = process.exit;
          process.exit = jest.fn(code => {
            process.exit = originalExit;
            expect.hasAssertions();
            expect(code).toBe(0);
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .addTemplate = jest.fn(async (category, template, templatePath, isGlobal) => {
              expect(category).toEqual('MyCategory');
              expect(template).toEqual('MyTemplate');
              expect(templatePath).toEqual(path.resolve(process.cwd(), 'my/template/path'));
              expect(isGlobal).toEqual(false);
            });
          antCli._yargs.parse('template add MyCategory MyTemplate my/template/path');
        }
      );

      test(
        'should not work without "category" arg',
        () => _expectErrorMessage('template add',
          'Fatal => Template add command requires category, template and path arguments',
          'ant.js --help template add')
      );

      test(
        'should not work without "template" arg',
        () => _expectErrorMessage('template add MyCategory',
          'Fatal => Template add command requires category, template and path arguments',
          'ant.js --help template add')
      );

      test(
        'should not work without "path" arg',
        () => _expectErrorMessage('template add MyCategory myTemplate',
          'Fatal => Template add command requires category, template and path arguments',
          'ant.js --help template add')
      );

      test(
        'should work with "category", "template" and "templatePath" args and "--global" or "-g" option',
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
            .addTemplate = jest.fn(async (category, template, templatePath, isGlobal) => {
              expect(category).toEqual('MyCategory');
              expect(template).toEqual('MyTemplate');
              expect(templatePath).toEqual('/path/to/my/template');
              expect(isGlobal).toEqual(true);
            });
          antCli._yargs.parse('template add MyCategory MyTemplate /path/to/my/template --global');
        }
      );

      test(
        'should print command help',
        () => _expectSuccessMessage(
          '--help template add',
          'ant.js template add <category> <template> <path> [--global]',
          'Adds/overrides a template',
          'category  The template category                                     [required]',
          'template  The template to be added/overwritten                      [required]',
          'path      The path to the template files                            [required]',
          `--global, -g   Adds template into global configuration file
                                                      [boolean] [default: false]`
        )
      );

      test(
        'should handle addTemplate error',
        (done) => {
          const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
          yargsHelper.handleErrorMessage = jest.fn(message => {
            yargsHelper.handleErrorMessage = originalHandleErrorMessage;
            expect(message).toBe('Mocked error');
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .addTemplate = jest.fn(async () => {
              throw Error('Mocked error');
            });
          antCli._yargs.parse('template add MyCategory MyTemplate foo/bar');
        }
      );
    });

    describe('template remove command', () => {
      test(
        'should work only with "template" and "category" args',
        (done) => {
          const originalExit = process.exit;
          process.exit = jest.fn(code => {
            process.exit = originalExit;
            expect.hasAssertions();
            expect(code).toBe(0);
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .removeTemplate = jest.fn(async (category, template, isGlobal) => {
              expect(category).toEqual('MyCategory');
              expect(template).toEqual('MyTemplate');
              expect(isGlobal).toEqual(false);
            });
          antCli._yargs.parse('template remove MyCategory MyTemplate');
        }
      );

      test(
        'should not work without "template" arg',
        () => _expectErrorMessage('template remove',
          'Fatal => Template remove command requires category and template arguments',
          'ant.js --help template remove')
      );

      test(
        'should work with "category" and "template" args and "--global" or "-g" option',
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
            .removeTemplate = jest.fn(async (category, template, isGlobal) => {
              expect(category).toEqual('MyCategory');
              expect(template).toEqual('MyTemplate');
              expect(isGlobal).toEqual(true);
            });
          antCli._yargs.parse('template remove MyCategory MyTemplate --global');
        }
      );

      test(
        'should print command help',
        () => _expectSuccessMessage(
          '--help template remove',
          'ant.js template remove <category> <template> [--global]',
          'Removes a template',
          'category  The template category                                     [required]',
          'template  The template to be removed                                [required]',
          `--global, -g   Removes template from global configuration file
                                                      [boolean] [default: false]`
        )
      );

      test(
        'should handle removeTemplate error',
        (done) => {
          const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
          yargsHelper.handleErrorMessage = jest.fn(message => {
            yargsHelper.handleErrorMessage = originalHandleErrorMessage;
            expect(message).toBe('Mocked error');
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('Core')
            .removeTemplate = jest.fn(async () => {
              throw Error('Mocked error');
            });
          antCli._yargs.parse('template remove MyCategory MyTemplate');
        }
      );
    });

    describe('template ls command', () => {
      test('should work', (done) => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .listTemplates = jest.fn(async (args) => {
            expect(args).toBeUndefined();
          });
        antCli._yargs.parse('template ls');
      });

      test('should handle any errors', (done) => {
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn((message, e, command) => {
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          expect(e).toBeInstanceOf(Error);
          expect(message).toBe('Mocked error');
          expect(command).toBe('template ls');
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .listTemplates = jest.fn(async () => {
            throw Error('Mocked error');
          });
        antCli._yargs.parse('template ls');
      });
    });

    describe('function add command', () => {
      test('should work', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .addFunction = jest.fn(async (name, func, runtime, version, type, isGlobal) => {
            expect(name).toBe('myfunc');
            expect(func).toBe('path/to/myfunc');
            expect(runtime).toBe('nodejs');
            expect(version).toBe('6');
            expect(type).toBe('lib');
            expect(isGlobal).toBe(false);
          });
        antCli._yargs.parse('function add myfunc path/to/myfunc nodejs 6');
      });

      test('should work with global flag', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .addFunction = jest.fn(async (name, path, runtime, version, type, isGlobal) => {
            expect(name).toBe('myfunc');
            expect(path).toBe('/path/to/myfunc');
            expect(runtime).toBe('nodejs');
            expect(version).toBe('6');
            expect(type).toBe('lib');
            expect(isGlobal).toBe(true);
          });
        antCli._yargs.parse('function add myfunc /path/to/myfunc nodejs 6 --global');
      });

      test('should work with template', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .addFunction = jest.fn(async (name, path, runtime, version, type, isGlobal, template) => {
            expect(name).toBe('myfunc');
            expect(template).toBe('/path/to/my/template');
          });
        antCli._yargs.parse('function add myfunc --template /path/to/my/template');
      });

      test('should handle any errors', done => {
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn((message, e, command) => {
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          expect(e).toBeInstanceOf(Error);
          expect(message).toBe('Mocked error');
          expect(command).toBe('function add');
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .addFunction = jest.fn(async () => {
            throw new Error('Mocked error');
          });
        antCli._yargs.parse('function add myfunc /path/to/myfunc nodejs');
      });
    });

    describe('function remove command', () => {
      test('should work', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .removeFunction = jest.fn(async (name, isGlobal) => {
            expect(name).toBe('myfunc');
            expect(isGlobal).toBe(false);
          });
        antCli._yargs.parse('function remove myfunc');
      });

      test('should work with global flag', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .removeFunction = jest.fn(async (name, isGlobal) => {
            expect(name).toBe('myfunc');
            expect(isGlobal).toBe(true);
          });
        antCli._yargs.parse('function remove myfunc --global');
      });

      test('should handle any errors', done => {
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn((message, e, command) => {
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          expect(e).toBeInstanceOf(Error);
          expect(message).toBe('Mocked error');
          expect(command).toBe('function remove');
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .removeFunction = jest.fn(async () => {
            throw new Error('Mocked error');
          });
        antCli._yargs.parse('function remove myfunc');
      });
    });

    describe('function ls command', () => {
      test('should work', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .listFunctions = jest.fn(async (args) => {
            expect(args).toBeUndefined();
          });
        antCli._yargs.parse('function ls');
      });

      test('should handle any errors', done => {
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn((message, e, command) => {
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          expect(e).toBeInstanceOf(Error);
          expect(message).toBe('Mocked error');
          expect(command).toBe('function ls');
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .listFunctions = jest.fn(async () => {
            throw new Error('Mocked error');
          });
        antCli._yargs.parse('function ls');
      });
    });

    describe('function exec command', () => {
      test('should work', done => {
        console.log = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(code => {
          expect.hasAssertions();
          expect(console.log).toHaveBeenCalledWith('Function myfunc executed succesfully');
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .execFunction = jest.fn(async (func, args) => {
            expect(func).toBe('myfunc');
            expect(args).toEqual([]);
            return rx.of('mock');
          });
        antCli._yargs.parse('function exec myfunc');
      });

      test('should work with params', done => {
        console.log = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(code => {
          expect.hasAssertions();
          expect(console.log).toHaveBeenCalledWith('Function myfunc executed succesfully');
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .execFunction = jest.fn(async (func, params) => {
            expect(func).toBe('myfunc');
            expect(params).toEqual(['foo', 'bar']);
            return rx.of('mock');
          });
        antCli._yargs.parse('function exec myfunc foo bar');
      });

      test('should print any execution error', done => {
        console.log = jest.fn();
        jest.spyOn(process, 'exit').mockImplementation(code => {
          expect.hasAssertions();
          expect(console.log).toHaveBeenCalledWith('Mocked error');
          expect(code).toBe(1);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .execFunction = jest.fn(async (func, params) => {
            expect(func).toBe('mockederror');
            expect(params).toEqual([]);
            return rx.throwError('Mocked error');
          });
        antCli._yargs.parse('function exec mockederror');
      });

      test('should handle any errors', done => {
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn((message, e, command) => {
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          expect(e).toBeInstanceOf(Error);
          expect(message).toBe('Mocked error');
          expect(command).toBe('function exec');
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .execFunction = jest.fn(async () => {
            throw new Error('Mocked error');
          });
        antCli._yargs.parse('function exec error');
      });
    });

    describe('runtime add command', () => {
      test('should work', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .addRuntime = jest.fn(async (name, version, bin, extensions, isGlobal) => {
            expect(name).toBe('myruntime');
            expect(version).toBe('10');
            expect(bin).toBe(path.resolve(process.cwd(), bin));
            expect(extensions).toEqual(['foo', 'bar']);
            expect(isGlobal).toBe(false);
          });
        antCli._yargs.parse('runtime add myruntime 10 path/to/myruntime foo bar');
      });

      test('should work with global flag', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .addRuntime = jest.fn(async (name, version, bin, extensions, isGlobal) => {
            expect(name).toBe('myruntime');
            expect(version).toBe('10');
            expect(bin).toBe('/path/to/myruntime');
            console.log(extensions);
            expect(extensions).toEqual(['nodejs', 'python']);
            expect(isGlobal).toBe(true);
          });
        antCli._yargs.parse('runtime add myruntime 10 /path/to/myruntime nodejs python --global');
      });

      test('should handle any errors', done => {
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn((message, e, command) => {
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          expect(e).toBeInstanceOf(Error);
          expect(message).toBe('Mocked error');
          expect(command).toBe('runtime add');
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .addRuntime = jest.fn(async () => {
            throw new Error('Mocked error');
          });
        antCli._yargs.parse('runtime add myruntime 10 /path/to/myruntime nodejs python');
      });
    });

    describe('runtime remove command', () => {
      test('should work', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .removeRuntime = jest.fn(async (name, version, isGlobal) => {
            expect(name).toBe('myruntime');
            expect(version).toBe('5');
            expect(isGlobal).toBe(false);
          });
        antCli._yargs.parse('runtime remove myruntime 5');
      });

      test('should work with global flag', done => {
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect.hasAssertions();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .removeRuntime = jest.fn(async (name, version, isGlobal) => {
            expect(name).toBe('myruntime');
            expect(version).toBe('5');
            expect(isGlobal).toBe(true);
          });
        antCli._yargs.parse('runtime remove myruntime 5 --global');
      });

      test('should handle any errors', done => {
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn((message, e, command) => {
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          expect(e).toBeInstanceOf(Error);
          expect(message).toBe('Mocked error');
          expect(command).toBe('runtime remove');
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .removeRuntime = jest.fn(async () => {
            throw new Error('Mocked error');
          });
        antCli._yargs.parse('runtime remove myruntime 5');
      });
    });

    describe('runtime ls command', () => {
      test('runtime ls should invoke Core listRuntime function', done => {
        const listRuntimesMock = jest.fn();
        const originalExit = process.exit;
        process.exit = jest.fn(code => {
          process.exit = originalExit;
          expect(listRuntimesMock).toHaveBeenCalledWith();
          expect(code).toBe(0);
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .listRuntimes = listRuntimesMock;
        antCli._yargs.parse('runtime ls');
      });

      test('should handle any runtime ls errors', done => {
        const originalHandleErrorMessage = yargsHelper.handleErrorMessage;
        yargsHelper.handleErrorMessage = jest.fn((message, e, command) => {
          yargsHelper.handleErrorMessage = originalHandleErrorMessage;
          expect(e).toBeInstanceOf(Error);
          expect(message).toBe('Mocked error');
          expect(command).toBe('runtime ls');
          done();
        });

        const antCli = new AntCli();
        antCli
          ._ant
          .pluginController
          .getPlugin('Core')
          .listRuntimes = jest.fn(async () => {
            throw new Error('Mocked error');
          });
        antCli._yargs.parse('runtime ls');
      });
    });
  });

  describe('GraphQL plugin', () => {
    describe('start command', () => {
      const originalCwd = process.cwd();
      const graphQlPluginConfigPath = path.resolve(
        utilPath,
        './configs/graphQLPluginConfig'
      );

      beforeEach(() => {
        process.chdir(graphQlPluginConfigPath);
      });

      afterEach(() => {
        process.chdir(originalCwd);
      });

      test(
        'should work with no args',
        done => {
          const startMock = jest.fn();
          const originalExit = process.exit;
          process.exit = jest.fn(code => {
            process.exit = originalExit;
            expect(startMock).toHaveBeenCalledWith();
            expect(code).toBe(0);
            done();
          });

          const antCli = new AntCli();
          antCli
            ._ant
            .pluginController
            .getPlugin('GraphQL')
            .startService = startMock;
          antCli._yargs.parse('start');
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
