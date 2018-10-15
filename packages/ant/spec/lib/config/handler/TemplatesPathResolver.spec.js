/**
 * @fileoverview Tests for lib/config/handler/TemplatesPathResolver.js file.
 */

const TemplatesPathResolver = require('../../../../lib/config/handler/TemplatesPathResolver');

const resolver = new TemplatesPathResolver();

describe('lib/config/handler/TemplatesPathResolver.js', () => {
  test('should resolve absolute template path with absolute basePath', () => {
    const json = {
      basePath: '/foo/bar',
      templates: {
        MyCategory: {
          MyTemplate: '/my/template/path'
        }
      }
    };
    resolver.handle(json);
    expect(json.templates).toEqual({
      MyCategory: {
        MyTemplate: '/my/template/path'
      }
    });
  });

  test('should resolve relative template path with absolute basePath', () => {
    const json = {
      basePath: '/foo/bar',
      templates: {
        MyCategory: {
          MyTemplate: './my/template/path'
        }
      }
    };
    resolver.handle(json);
    expect(json.templates).toEqual({
      MyCategory: {
        MyTemplate: '/foo/bar/my/template/path'
      }
    });
  });

  test('should resolve template path with absolute basePath', () => {
    const json = {
      basePath: '/foo/bar',
      templates: {
        MyCategory: {
          MyTemplate: 'my/template/path'
        }
      }
    };
    resolver.handle(json);
    expect(json.templates).toEqual({
      MyCategory: {
        MyTemplate: '/foo/bar/my/template/path'
      }
    });
  });
});
