/**
 * @fileoverview Tests for index.js file.
 */

describe('index.js', () => {
  test('should export "Core" class', () => {
    expect(require('../')).toEqual(
      require('../lib/Core')
    );
  });
});
