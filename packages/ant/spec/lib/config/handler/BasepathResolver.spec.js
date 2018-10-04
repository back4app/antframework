/**
 * @fileoverview Tests for lib/config/handler/BasepathResolver.js file.
 */

const path = require('path');
const BasepathResolver = require('../../../../lib/config/handler/BasepathResolver');

const resolver = new BasepathResolver();

const assertBasePath = (filePath, basePath, expectedBasePath) => {
  const json = basePath ? { basePath } : {};
  resolver.handle(json, filePath ? { filePath } : {});
  expect(json.basePath).toBe(expectedBasePath);
};
const assertPluginBasePath = (basePath, expectedBasePath) => {
  const json = { basePath: '/assert', plugins: [
    {
      myPlugin: {
        basePath
      }
    }
  ]};
  resolver.handle(json, {});
  expect(json.plugins[0].myPlugin.basePath).toBe(expectedBasePath);
};
describe('lib/config/handler/BasepathResolver.js', () => {
  test('should set basePath with absolute filePath and relative basePath', () => {
    assertBasePath(
      '/absolute/resolvePathTest.yml',
      './foo/bar',
      '/absolute/foo/bar'
    );
  });

  test('should set basePath with absolute filePath and absolute basePath', () => {
    assertBasePath(
      '/absolute/resolvePathTest.yml',
      '/foo/bar',
      '/foo/bar'
    );
  });

  test('should set basePath with absolute filePath and no basePath', () => {
    assertBasePath(
      '/absolute/resolvePathTest.yml',
      null,
      '/absolute'
    );
  });

  test('should set basePath with relative filePath and relative basePath', () => {
    assertBasePath(
      './relative/path/ant.yml',
      './foo/bar',
      path.resolve(process.cwd(), './relative/path/foo/bar')
    );
  });

  test('should set basePath with relative filePath and absolute basePath', () => {
    assertBasePath(
      './relative/path/ant.yml',
      '/foo/bar',
      path.resolve('/foo/bar')
    );
  });

  test('should set basePath with relative filePath and no basePath', () => {
    assertBasePath(
      './relative/path/ant.yml',
      null,
      path.resolve(process.cwd(), './relative/path')
    );
  });

  test('should set basePath with no filePath and relative basePath', () => {
    assertBasePath(
      null,
      './foo/bar',
      path.resolve(process.cwd(), './foo/bar')
    );
  });

  test('should set basePath with no filePath and absolute basePath', () => {
    assertBasePath(
      null,
      '/foo/bar',
      '/foo/bar'
    );
  });

  test('should set basePath with no filePath and no basePath', () => {
    assertBasePath(
      null,
      null,
      process.cwd()
    );
  });

  test('should set plugin basePath', () => {
    assertPluginBasePath('./myBasePath', '/assert/myBasePath');
  });

  test('should not set plugin basePath', () => {
    assertPluginBasePath('/myBasePath', '/myBasePath');
  });
});
