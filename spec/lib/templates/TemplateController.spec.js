/**
 * @fileoverview Tests for lib/templates/TemplateController.js file.
 */

const Ant = require('../../../lib/Ant');
const Plugin = require('../../../lib/plugins/Plugin');
const Template = require('../../../lib/templates/Template');
const TemplateController = require('../../../lib/templates/TemplateController');

const ant = new Ant();
const templateController = new TemplateController(ant);

describe('lib/templates/TemplateController.js', () => {
  test('should export "TemplateController" class', () => {
    expect(templateController.constructor.name).toEqual('TemplateController');
  });

  test('should load plugins\' templates', () => {
    const template1 = new Template('Category1', 'Template1', 'Path1');
    const template11 = new Template('Category1', 'Template11', 'Path11');
    const template2 = new Template('Category2', 'Template2', 'Path2');
    const template2v2 = new Template('Category2', 'Template2', 'Path2v2');

    /**
     * Represents a {@link Plugin} with templates for testing purposes.
     * @extends Plugin
     * @private
     */
    class PluginWithTemplates extends Plugin {
      get templates() {
        return [template1, template11, template2, template2v2];
      }
    }

    const antWithTemplates = new Ant({ plugins: [PluginWithTemplates] });
    expect(
      antWithTemplates.templateController._templates.has('Category1')
    ).toBeTruthy();
    expect(
      antWithTemplates.templateController._templates
        .get('Category1')
        .get('Template1')
    ).toEqual(template1);
    expect(
      antWithTemplates.templateController._templates
        .get('Category1')
        .get('Template11')
    ).toEqual(template11);
    expect(
      antWithTemplates.templateController._templates.has('Category2')
    ).toBeTruthy();
    expect(
      antWithTemplates.templateController._templates
        .get('Category2')
        .get('Template2')
    ).toEqual(template2v2);
  });

  test('should fail if "ant" param is not passed', () => {
    expect(() => new TemplateController()).toThrowError(
      'Could not initialize the template controller: param "ant" is required'
    );
  });

  test('should fail if "ant" param is not Ant', () => {
    expect(() => new TemplateController({})).toThrowError(
      'Could not initialize the template controller: param "ant" should be Ant'
    );
  });

  describe('TemplateController.ant', () => {
    test('should be readonly', () => {
      expect(templateController.ant).toEqual(ant);
      templateController.ant = new Ant();
      expect(templateController.ant).toEqual(ant);
    });
  });

  describe('TemplateController.getTemplate', () => {
    test('should return null if template not found', () => {
      expect(templateController.getTemplate('Service', 'Default')).toEqual(
        expect.any(Template)
      );
      expect(templateController.getTemplate('Service', 'NotExistent'))
        .toEqual(null);
      expect(templateController.getTemplate('NotExistent', 'Default'))
        .toEqual(null);
    });
  });
});
