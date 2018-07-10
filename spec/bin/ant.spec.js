/**
 * @fileoverview Tests for bin/ant.js file.
 */

const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const binPath = path.resolve(`${__dirname}/../../bin/ant.js`);

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
    'Usage: ant.js [--help] [--version] <command> [<args>]'
  );
  expect(stdout).toContain(
    '--help, -h     Show help                                             [boolean]'
  );
  expect(stdout).toContain(
    '--version, -v  Show version number                                   [boolean]'
  );
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
  try {
    await exec(
      `${binPath}${args ? ` ${args}` : ''}`
    );
    throw new Error('Expected an exception to be thrown');
  } catch (e) {
    const { code, stdout, stderr } = e;
    expect(code).toEqual(1);
    expect(stdout).toEqual('');
    expect(stderr).toEqual(`${errorMessage}\n`);
  }
}

/**
 * Helper function to run the CLI command with args and check the expected CLI
 * version.
 * @param {string} args The args to be sent to the CLI command.
 * @async
 * @private
 */
async function _expectPackageVersion(args) {
  const { stdout, stderr } = await exec(`${binPath}${args ? ` ${args}` : ''}`);
  const packageVersion = require(
    path.resolve(`${__dirname}/../../package.json`)
  ).version;
  expect(stdout).toEqual(`${packageVersion}\n`);
  expect(stderr).toEqual('');
}

describe('bin/ant.js', () => {
  it(
    'should print usage instructions when called with no commands nor options',
    () => _expectUsageInstructions(null)
  );

  it(
    'should print error when calling with an inexistent command',
    () => _expectErrorMessage('foo', 'Fatal => Unknown argument: foo')
  );

  it(
    'should print error when calling with more than one command',
    () => _expectErrorMessage(
      'cmd1 cmd2',
      'Fatal => You can run only one command per call'
    )
  );

  it(
    'should recommend commands',
    () => _expectErrorMessage(
      'somecomman',
      'Fatal => Did you mean somecommand?'
    )
  );

  it('should have --help option', () => _expectUsageInstructions('--help'));

  it('should have -h alias', () => _expectUsageInstructions('-h'));

  it(
    'should print package.json version when calling --version option',
    () => _expectPackageVersion('--version')
  );

  it('should have -v alias', () => _expectPackageVersion('-v'));
});
