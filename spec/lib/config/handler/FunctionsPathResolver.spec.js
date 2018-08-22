/**
 * @fileoverview Tests for lib/config/handler/BasepathResolver.js file.
 */

const FunctionsPathResolver = require('../../../../lib/config/handler/FunctionsPathResolver');
const path = require('path');
const resolver = new FunctionsPathResolver();

const assertFunctions = (functions, basePath, expectedFunctions) => {
  const json = basePath ? { basePath } : {};
  json.functions = functions;
  resolver.handle(json);
  expect(json.functions).toEqual(expectedFunctions);
};

describe('lib/config/handler/FunctionsPathResolver.js', () => {
  test('should do nothing if does not contain functions', () => {
    const json = {
      basePath: '/foo/bar',
      plugins: [
        './my/plugin',
        '/absolute/plugin'
      ],
      templates: {
        MyCategory: {
          MyTemplate: 'path/to/my/template',
          AbsoluteTemplate: '/absolute/template'
        }
      }
    };
    resolver.handle(json);
    expect(json).toEqual({
      basePath: '/foo/bar',
      plugins: [
        './my/plugin',
        '/absolute/plugin'
      ],
      templates: {
        MyCategory: {
          MyTemplate: 'path/to/my/template',
          AbsoluteTemplate: '/absolute/template'
        }
      }
    });
  });

  test('should do nothing if function does not have a bin or handler', () => {
    assertFunctions(
      [{ name: 'bla', runtime: 'nodejs' }],
      './foo/bar',
      [{ name: 'bla', runtime: 'nodejs' }]
    );
  });

  describe('bin path', () => {
    test('should resolve bin path with absolute function path and relative basePath', () => {
      assertFunctions(
        [{ bin: '/absolute/my/function'}],
        './foo/bar',
        [{ bin: '/absolute/my/function'}]
      );
    });

    test('should resolve bin path with absolute function path and absolute basePath', () => {
      assertFunctions(
        [{ bin: '/absolute/my/function'}],
        '/foo/bar',
        [{ bin: '/absolute/my/function'}]
      );
    });

    test('should resolve bin path with relative function path and relative basePath', () => {
      assertFunctions(
        [{ bin: './my/function'}],
        './foo/bar',
        [{ bin: path.resolve(process.cwd(), './foo/bar/my/function')}]
      );
    });

    test('should resolve bin path with relative function path and absolute basePath', () => {
      assertFunctions(
        [{ bin: './my/function'}],
        '/foo/bar',
        [{ bin: '/foo/bar/my/function'}]
      );
    });
  });

  describe('handler path', () => {
    test('should resolve handler path with absolute function path and relative basePath', () => {
      assertFunctions(
        [{ handler: '/absolute/my/function'}],
        './foo/bar',
        [{ handler: '/absolute/my/function'}]
      );
    });

    test('should resolve handler path with absolute function path and absolute basePath', () => {
      assertFunctions(
        [{ handler: '/absolute/my/function'}],
        '/foo/bar',
        [{ handler: '/absolute/my/function'}]
      );
    });

    test('should resolve handler path with relative function path and relative basePath', () => {
      assertFunctions(
        [{ handler: './my/function'}],
        './foo/bar',
        [{ handler: path.resolve(process.cwd(), './foo/bar/my/function')}]
      );
    });

    test('should resolve handler path with relative function path and absolute basePath', () => {
      assertFunctions(
        [{ handler: './my/function'}],
        '/foo/bar',
        [{ handler: '/foo/bar/my/function'}]
      );
    });
  });
});
