/* eslint-disable no-console */

describe('lib/cli/ant.js', () => {
  it('should print welcome message', () => {
    spyOn(console, 'log');
    require('../../../lib/cli/ant.js');
    expect(console.log).toHaveBeenCalledWith('Hello World!');
  });
});
