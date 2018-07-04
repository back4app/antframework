/**
 * @fileoverview Tests for lib/cli/AntCli.js file.
 */

describe('lib/cli/AntCli.js', () => {
  it('should export "AntCli" class with "export" method', () => {
    const AntCli = require('../../../lib/cli/AntCli');
    const antCli = new AntCli();
    expect(antCli.constructor.name).toEqual('AntCli');
    expect(typeof antCli.execute).toEqual('function');
  });
});
