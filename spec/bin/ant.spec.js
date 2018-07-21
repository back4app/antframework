/**
 * @fileoverview Tests for bin/ant.js file.
 */

const path = require('path');
const fs = require('fs-extra');
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
    'Usage: ant.js [--help] [--version] [--verbose] <command> [<args>] [<options>]'
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
    expect(stderr).toContain(`${errorMessage}\n`);
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
  expect(stdout).toContain(successMessage);
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
      { cwd: path.resolve(__dirname, '../support/configs/FooPluginConfig')}
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
  });
});
