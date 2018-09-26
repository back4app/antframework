/**
 * @fileoverview Tests for lib/plugins/core/index.js file.
 */

describe('lib/plugins/core/index.js', () => {
  test('should export "Core" class', () => {
    expect(require('../../../../lib/plugins/core')).toEqual(
      require('../../../../lib/plugins/core/lib/Core')
    );
  });
});
