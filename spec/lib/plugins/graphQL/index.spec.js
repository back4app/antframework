/**
 * @fileoverview Tests for lib/plugins/graphQL/index.js file.
 */

describe('lib/plugins/graphQL/index.js', () => {
  test('should export "GraphQL" class', () => {
    expect(require('../../../../lib/plugins/graphQL')).toEqual(
      require('../../../../lib/plugins/graphQL/lib/GraphQL')
    );
  });

  test('should export "Directive" class', () => {
    expect(require('../../../../lib/plugins/graphQL').Directive).toEqual(
      require('../../../../lib/plugins/graphQL/lib/directives/Directive')
    );
  });
});
