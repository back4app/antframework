/**
 * @fileoverview Tests for GraphQL Server - index.js file.
 */

const index = require('../');
const Server = require('../lib/Server');

describe('GraphQL Server - index.js', () => {
  test('should export "Server" class', () => {
    expect(index).toEqual(
      Server
    );
  });
});
