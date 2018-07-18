/**
 * @fileoverview Tests for lib/templates/template.js file.
 */

const Template = require('../../../lib/templates/Template');

const template = new Template('FooCategory', 'FooTemplate', __dirname);

describe('lib/templates/Template.js', () => {
  test('should export "Template" class', () => {
    expect(template.constructor.name).toEqual('Template');
  });

  test('should fail if category or name is not a String', () => {
    expect(() => new Template()).toThrowError(
      'Could not initialize Template class: param "category" should be String'
    );
    expect(() => new Template('FooCategory')).toThrowError(
      'Could not initialize Template class: param "name" should be String'
    );
    expect(() => new Template(null, 'FooTemplate')).toThrowError(
      'Could not initialize Template class: param "category" should be String'
    );
  });

  describe('Template.category', () => {
    test('should be readonly', () => {
      expect(template.category).toEqual('FooCategory');
      template.category = 'AnotherFooCategory';
      expect(template.category).toEqual('FooCategory');
    });
  });

  describe('Template.name', () => {
    test('should be readonly', () => {
      expect(template.name).toEqual('FooTemplate');
      template.name = 'AnotherFooTemplate';
      expect(template.name).toEqual('FooTemplate');
    });
  });
});
