const path = require('path');
const { exec } = require('child_process');

/**
 * @fileoverview Tests for bin/ant.js file.
 */

const binPath = path.resolve(`${__dirname}/../../bin/ant.js`);

/**
 * Helper function to run the CLI command with args and check the expected
 * usage instructions as an output.
 * @param {string} args The args to be sent to the CLI command.
 * @param {Function} done The callback function to be called when the checks are
 * completed.
 * @private
 */
function _expectUsageInstructions(args, done) {
  exec(
    `${binPath}${args ? ` ${args}` : ''}`,
    (error, stdout, stderr) => {
      expect(error).toBeNull();
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
        'For more information, visit https://github.com/back4app/antfn'
      );
      expect(stderr).toEqual('');
      done();
    }
  );
}

/**
 * Helper function to run the CLI command with args and check the expected error
 * message as an output.
 * @param {string} args The args to be sent to the CLI command.
 * @param {string} errorMessage The expected error message.
 * @param {Function} done The callback function to be called when the checks are
 * completed.
 * @private
 */
function _expectErrorMessage(args, errorMessage, done) {
  exec(
    `${binPath}${args ? ` ${args}` : ''}`,
    (error, stdout, stderr) => {
      expect(error).not.toBeNull();
      expect(error.code).toEqual(1);
      expect(stdout).toEqual('');
      expect(stderr).toEqual(`${errorMessage}\n`);
      done();
    }
  );
}

/**
 * Helper function to run the CLI command with args and check the expected CLI
 * version.
 * @param {string} args The args to be sent to the CLI command.
 * @param {Function} done The callback function to be called when the checks are
 * completed.
 * @private
 */
function _expectPackageVersion(args, done) {
  exec(
    `${binPath}${args ? ` ${args}` : ''}`,
    (error, stdout, stderr) => {
      expect(error).toBeNull();
      const packageVersion = require(
        path.resolve(`${__dirname}/../../package.json`)
      ).version;
      expect(stdout).toEqual(`${packageVersion}\n`);
      expect(stderr).toEqual('');
      done();
    }
  );
}

describe('bin/ant.js', () => {
  it(
    'should print usage instructions when called with no commands nor options',
    done => _expectUsageInstructions(null, done)
  );

  it(
    'should print error when calling when an inexistent command',
    done => _expectErrorMessage('foo', 'Fatal => Unknown argument: foo', done)
  );

  it(
    'should print error when calling with more than one command',
    done => _expectErrorMessage(
      'cmd1 cmd2',
      'Fatal => You can run only one command per call',
      done
    )
  );

  it(
    'should recommend commands',
    done => _expectErrorMessage(
      'somecomman',
      'Fatal => Did you mean somecommand?',
      done
    )
  );

  it(
    'should have --help option',
    done => _expectUsageInstructions('--help', done)
  );

  it('should have -h alias', done => _expectUsageInstructions('-h', done));

  it(
    'should print package.json version when calling --version option',
    done => _expectPackageVersion('--version', done)
  );

  it('should have -v alias', done => _expectPackageVersion('-v', done));
});
