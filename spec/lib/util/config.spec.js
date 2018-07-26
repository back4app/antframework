/**
 * @fileoverview Tests for lib/util/config.js file.
 */

const configUtils = require('../../../lib/util/config');

describe('lib/util/config.js', () => {
  test('should load templates from config', () => {
    const customTemplatePath = '/path/to/my/custom';
    const fooPath = '/path/to/foo';
    const barPath = '/path/to/bar';
    const templatesConfig = {
      CustomCategory: {
        CustomTemplate: customTemplatePath,
        Foo: fooPath
      },
      Custom_2: {
        Bar: barPath
      }
    };
    const parsedTemplates = configUtils.parseConfigTemplates(templatesConfig);
    expect(parsedTemplates.length).toBe(3);

    expect(parsedTemplates[0].category).toEqual('CustomCategory');
    expect(parsedTemplates[0].name).toEqual('CustomTemplate');
    expect(parsedTemplates[0].path).toEqual(customTemplatePath);

    expect(parsedTemplates[1].category).toEqual('CustomCategory');
    expect(parsedTemplates[1].name).toEqual('Foo');
    expect(parsedTemplates[1].path).toEqual(fooPath);

    expect(parsedTemplates[2].category).toEqual('Custom_2');
    expect(parsedTemplates[2].name).toEqual('Bar');
    expect(parsedTemplates[2].path).toEqual(barPath);
  });

  test('should throw error with invalid templates config', () => {
    expect(() => configUtils.parseConfigTemplates('this should\'ve been an object'))
      .toThrowError(
        'Error while loading templates from Ant\'s config file. \
The "template" configuration should be an object!'
      );
  });

  test('should throw error with invalid template category value', () => {
    const templatesConfig = {
      CustomCategory: 'this should\'ve been an object!'
    };
    expect(() => configUtils.parseConfigTemplates(templatesConfig))
      .toThrowError(
        'Error while loading templates from Ant\'s config file: \
Template category value is not an object!'
      );
  });
});
