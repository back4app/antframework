const path = require('path');
const { exec } = require('child_process');

describe('bin/ant.js', () => {
  it('should print welcome message', (done) => {
    exec(
      path.resolve(`${__dirname}/../../bin/ant.js`),
      (error, stdout, stderr) => {
        expect(error).toBeNull();
        expect(stdout).toEqual('Hello World!\n');
        expect(stderr).toEqual('');
        done();
      }
    );
  });
});
