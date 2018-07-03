const path = require('path');
const { exec } = require('child_process');

/**
 * @fileoverview Tests for bin/ant.js file.
 */

describe('bin/ant.js', () => {
  it('should print usage instructions', (done) => {
    exec(
      path.resolve(`${__dirname}/../../bin/ant.js`),
      (error, stdout, stderr) => {
        expect(error).toBeNull();
        expect(stdout.split('\n')[0])
          .toEqual('Usage: ant.js [--help] [--version] <command> [<args>]');
        expect(stderr).toEqual('');
        done();
      }
    );
  });
});
