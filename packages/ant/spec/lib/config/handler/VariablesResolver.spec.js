/**
 * @fileoverview Tests for lib/config/handler/VariablesResolver.js file.
 */

const path = require('path');
const VariablesResolver = require('../../../../lib/config/handler/VariablesResolver');

const resolver = new VariablesResolver();

describe('lib/config/handler/VariablesResolver.js', () => {
  const GLOBAL_DIR = path.resolve(__dirname, '../../../../');
  test('should replace $GLOBAL var on JSON', () => {
    const json = {
      basePath: '$GLOBAL/foo/bar',
      plugins: [
        '$GLOBAL/my/plugins',
        {
          '$GLOBAL/my/other/plugins': {
            basePath: '$GLOBAL/this/should/not/be/resolved',
            '$GLOBAL/this/should/not/be/resolved': {}
          }
        }
      ],
      test: 123
    };
    resolver.handle(json);
    const expectedPlugin = {};
    expectedPlugin[path.resolve(GLOBAL_DIR, 'my/other/plugins')] = {
      basePath: '$GLOBAL/this/should/not/be/resolved',
      '$GLOBAL/this/should/not/be/resolved': {}
    };
    expect(json).toEqual({
      basePath: path.resolve(GLOBAL_DIR, 'foo/bar'),
      plugins: [
        path.resolve(GLOBAL_DIR, 'my/plugins'),
        expectedPlugin
      ],
      test: 123
    });
  });

  test('should replace multiple $GLOBAL var on JSON', () => {
    const json = {
      basePath: '$GLOBAL/foo/bar',
      plugins: [
        '$GLOBAL/my/plugins',
        '$GLOBAL/my/plugins2',
        {
          '$GLOBAL/foo/bar1': {
            basePath: '$GLOBAL/this/should/not/be/resolved',
            '$GLOBAL/this/should/not/be/resolved': {}
          }
        },
        {
          '$GLOBAL/foo/bar2': {}
        }
      ],
      test: 123
    };
    resolver.handle(json);
    const expectedPlugin = {};
    expectedPlugin[path.resolve(GLOBAL_DIR, 'foo/bar1')] = {
      basePath: '$GLOBAL/this/should/not/be/resolved',
      '$GLOBAL/this/should/not/be/resolved': {}
    };
    const expectedPlugin2 = {};
    expectedPlugin2[path.resolve(GLOBAL_DIR, 'foo/bar2')] = {};
    expect(json).toEqual({
      basePath: path.resolve(GLOBAL_DIR, 'foo/bar'),
      plugins: [
        path.resolve(GLOBAL_DIR, 'my/plugins'),
        path.resolve(GLOBAL_DIR, 'my/plugins2'),
        expectedPlugin,
        expectedPlugin2
      ],
      test: 123
    });
  });
});
