/**
 * @fileoverview Tests for bin/ant.js file.
 */

const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
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
    'Usage: ant.js [--help] [--version] <command> [<args>] [<options>]'
  );
  expect(stdout).toContain(`Commands:
  ant.js create <service> [--template       Create a new service
  <name>]`);
  expect(stdout).toContain(
    '--help, -h     Show help                                             [boolean]'
  );
  expect(stdout).toContain(
    '--version, -v  Show version number                                   [boolean]'
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
 * message as an output.
 * @param {string} args The args to be sent to the CLI command.
 * @param {string} errorMessage The expected error message.
 * @async
 * @private
 */
async function _expectErrorMessage(args, errorMessage) {
  expect.hasAssertions();
  try {
    await exec(
      `${binPath}${args ? ` ${args}` : ''}`
    );
  } catch (e) {
    const { code, stdout, stderr } = e;
    expect(code).toEqual(1);
    expect(stdout).toEqual('');
    expect(stderr).toEqual(`${errorMessage}\n`);
  }
}

/**
 * Helper function to run the CLI command with args and check the expected CLI
 * success message.
 * @param {string} args The args to be sent to the CLI command.
 * @param {string} successMessage The expected success message.
 * @async
 * @private
 */
async function _expectSuccessMessage(args, successMessage) {
  const { stdout, stderr } = await exec(`${binPath}${args ? ` ${args}` : ''}`);
  expect(stdout).toEqual(successMessage);
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
      { cwd: path.resolve(__dirname, 'notAPluginConfig')}
    );
    expect(stdout).not.toBeNull();
    expect(stdout).toContain('Plugins:');
    expect(stdout).not.toContain('Core');
    expect(stderr).toEqual('');
  });

  test('should print plugin load error', async () => {
    const { stdout, stderr } = await exec(
      binPath,
      { cwd: path.resolve(__dirname, 'notAPluginConfig')}
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

  test('should have -v alias', () => _expectPackageVersion('-v'));

  test(
    'should print version with any command',
    () => _expectPackageVersion('-v foo')
  );

  describe('Core plugin', () => {
    describe('create command', () => {
      test(
        'should work only with "service" arg',
        () => _expectSuccessMessage('create MyService', '')
      );

      test(
        'should work with "service" arg and "--template" option',
        () => _expectSuccessMessage(
          'create MyService --template MyTemplate',
          ''
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
  --version, -v   Show version number                                  [boolean]
  --template, -t  Specify the template to be used for the new service
                                                   [string] [default: "Default"]
`
        )
      );

      test(
        'should fail without "service" arg',
        () => _expectErrorMessage('create', `Fatal => Not enough non-option arguments: got 0, need at least 1

For getting help:
ant.js --help [command]`)
      );

      test(
        'should fail without template name',
        () => _expectErrorMessage(
          'create MyService --template',
          `Fatal => Not enough arguments following: template

For getting help:
ant.js --help [command]`)
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
  });
});
