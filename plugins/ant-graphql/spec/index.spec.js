/**
 * @fileoverview Tests for index.js file.
 */

const index = require('../');

describe('index.js', () => {
  test('should export "GraphQL" class', () => {
    expect(index).toEqual(
      require('../lib/GraphQL')
    );
  });

  test('should export "Directive" class', () => {
    expect(index.Directive).toEqual(
      require('../lib/directives/Directive')
    );
  });
});
