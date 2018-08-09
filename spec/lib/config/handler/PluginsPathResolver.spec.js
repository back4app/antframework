/**
 * @fileoverview Tests for lib/config/handler/PluginsPathResolver.js file.
 */

const AntError = require('../../../../lib/util/AntError');
const path = require('path');
const PluginsPathResolver = require('../../../../lib/config/handler/PluginsPathResolver');
const resolver = new PluginsPathResolver();

describe('lib/config/handler/PluginsPathResolver.js', () => {
  const absoluteFooPluginPath = path.resolve(__dirname, '../../../support/plugins/FooPlugin');

  test('should resolve relative plugin path', () => {
    const json = {
      basePath: path.resolve(__dirname, '../../../support/plugins'),
      plugins: ['./FooPlugin']
    };
    resolver.handle(json);
    expect(json.plugins).toEqual([ absoluteFooPluginPath + '.js' ]);
  });

  test('should resolve absolute plugin path', () => {
    const json = {
      basePath: '/should/be/ignored',
      plugins: [absoluteFooPluginPath]
    };
    resolver.handle(json);
    expect(json.plugins).toEqual([ absoluteFooPluginPath ]);
  });

  test('should resolve node module plugin', () => {
    const json = {
      basePath: '/should/be/ignored',
      plugins: ['fs']
    };
    resolver.handle(json);
    expect(json.plugins).toEqual([ 'fs' ]);
  });

  test('should resolve relative plugins path with object plugin', () => {
    const json = {
      basePath: path.resolve(__dirname, '../../../support/plugins'),
      plugins: [
        {
          './FooPlugin': {}
        }
      ]
    };
    resolver.handle(json);
    const expected = {};
    expected[absoluteFooPluginPath + '.js'] = {};
    expect(json.plugins).toEqual([ expected ]);
  });

  test('should resolve absolute plugins path with object plugin', () => {
    const plugin = {};
    plugin[absoluteFooPluginPath + '.js'] = {};
    const json = {
      basePath: path.resolve(__dirname, '../../../support/plugins'),
      plugins: [ plugin ]
    };
    resolver.handle(json);
    expect(json.plugins).toEqual([ plugin ]);
  });

  test('should resolve node module plugin with object plugin', () => {
    const json = {
      basePath: path.resolve(__dirname, '../../../support/plugins'),
      plugins: [
        {
          'fs': {}
        }
      ]
    };
    resolver.handle(json);
    expect(json.plugins).toEqual([ { fs: {} } ]);
  });

  test('should fail to resolve node module plugin', () => {
    const json = {
      basePath: path.resolve(__dirname, '../../../support/plugins'),
      plugins: [
        {
          '@thispluginshouldnotexist': {}
        }
      ]
    };
    try {
      resolver.handle(json);
    } catch (e) {
      expect(e).toBeInstanceOf(AntError);
      expect(e.message).toBe(`Failed to resolve path of plugin \
"@thispluginshouldnotexist" with the base path ${json.basePath}`);
    }
  });

  test('should do nothing if plugins contains invalid nodes', () => {
    const json = {
      plugins: [
        123
      ]
    };
    resolver.handle(json);
    expect(json).toEqual({
      plugins: [
        123
      ]
    });
  });
});
