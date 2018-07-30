/**
 * @fileoverview Tests for index.js file.
 */

const index = require('../');
const Server = require('../lib/Server');

describe('index.js', () => {
  test('should export "Server" class', () => {
    expect(index).toEqual(
      Server
    );
  });
});
