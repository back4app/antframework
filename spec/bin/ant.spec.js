const path = require('path');
const { exec } = require('child_process');

/**
 * @fileoverview Tests for bin/ant.js file.
 */

describe('bin/ant.js', () => {
  it('should print welcome message', (done) => {
    exec(
      path.resolve(`${__dirname}/../../bin/ant.js`) + ' --help',
      (error, stdout, stderr) => {
        expect(error).toBeNull();
        expect(stdout.split('\n')[0]).toEqual('ant <cmd> [args]');
        expect(stderr).toEqual('');
        done();
      }
    );
  });
});
