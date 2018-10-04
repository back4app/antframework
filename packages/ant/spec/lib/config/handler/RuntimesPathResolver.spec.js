/**
 * @fileoverview Tests for lib/config/handler/RuntimesPathResolver.js file.
 */

const path = require('path');
const RuntimesPathResolver = require('../../../../lib/config/handler/RuntimesPathResolver');

const resolver = new RuntimesPathResolver();

const assertRuntimes = (runtimes, basePath, expectedRuntimes) => {
  const json = basePath ? { basePath } : {};
  json.runtimes = runtimes;
  resolver.handle(json);
  expect(json.runtimes).toEqual(expectedRuntimes);
};

describe('lib/config/handler/RuntimesPathResolver.js', () => {
  test('should do nothing if does not contain runtimes', () => {
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
      },
      functions: [
        {
          name: 'MyFunc',
          bin: '/my/func'
        },
        {
          name: 'MyLib',
          handler: '/my/lib',
          runtime: 'Default'
        }
      ]
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
      },
      functions: [
        {
          name: 'MyFunc',
          bin: '/my/func'
        },
        {
          name: 'MyLib',
          handler: '/my/lib',
          runtime: 'Default'
        }
      ]
    });
  });

  test('should do nothing if runtime does not have a bin', () => {
    assertRuntimes(
      { bla: { extensions: ['js'] }},
      './foo/bar',
      { bla: { extensions: ['js'] }}
    );
  });

  describe('bin path', () => {
    test('should resolve bin path with absolute function path and relative basePath', () => {
      assertRuntimes(
        { bla: { bin: '/absolute/my/function'}},
        './foo/bar',
        { bla: { bin: '/absolute/my/function'}}
      );
    });

    test('should resolve bin path with absolute function path and absolute basePath', () => {
      assertRuntimes(
        { bla: { bin: '/absolute/my/function'}},
        '/foo/bar',
        { bla: { bin: '/absolute/my/function'}}
      );
    });

    test('should resolve bin path with relative function path and relative basePath', () => {
      assertRuntimes(
        { bla: { bin: './my/function'}},
        './foo/bar',
        { bla: { bin: path.resolve(process.cwd(), './foo/bar/my/function')}}
      );
    });

    test('should resolve bin path with relative function path and absolute basePath', () => {
      assertRuntimes(
        { bla: { bin: './my/function'}},
        '/foo/bar',
        { bla: { bin: '/foo/bar/my/function'}}
      );
    });
  });
});
