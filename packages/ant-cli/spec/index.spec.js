/**
 * @fileoverview Tests for index.js file.
 */

describe('index.js', () => {
  test('should export "AntCli" class', () => {
    expect(require('../').AntCli).toEqual(
      require('../lib/AntCli')
    );
  });
});
