/**
 * @fileoverview Tests for lib/cli/antYargs.js file.
 */

describe('lib/cli/antYargs.js', () => {
  it('should export a yargs object', () => {
    expect(Object.keys(require('../../../lib/cli/antYargs.js')))
      .toContain('argv');
  });
});
