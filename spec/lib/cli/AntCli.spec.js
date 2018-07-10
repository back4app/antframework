/**
 * @fileoverview Tests for lib/cli/AntCli.js file.
 */

describe('lib/cli/AntCli.js', () => {
  test('should export "AntCli" class with "export" method', () => {
    const AntCli = require('../../../lib/cli/AntCli');
    const antCli = new AntCli();
    expect(antCli.constructor.name).toEqual('AntCli');
    expect(antCli.execute).toEqual(expect.any(Function));
  });
});
