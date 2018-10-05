/**
 * @fileoverview Tests for index.js file.
 */

const index = require('../');

describe('index.js', () => {
  test('should export "Serverless" class', () => {
    expect(index).toEqual(
      require('../lib/Serverless')
    );
  });
});
