/**
 * @fileoverview Defines and exports the {@link TemplateController} class.
 */

const assert = require('assert');
const Template = require('./Template');

/**
 * Represents a controller for the Ant Framework's templates.
 *
 * The main role of this controller is to provide and store the templates from
 * Ant's plugins.
 *
 * The templates are stored in a {@link Map}, having category as key, and
 * the value is another {@link Map} with the name as key and {@link Template} as value.
 * i.e.: _templates: <category, <name, template>>
 *
 * Notice that this controller does guarantee the unicity of a {@link Template},
 * given a category and name.
 * When two different {@link Template} with the same category and name are inserted
 * in the {@link Map}, the last one WILL override the first.
 *
 * @example <caption>Initializing TemplateController with templates.</caption>
 * const templates = [
 *   new Template('My Category', 'My Custom Template', '/path/to/my/template/files'),
 *   new Template('Service', 'My Other Custom Template', 'path/foo/bar')
 * ];
 * const templateController = new TemplateController(new Ant(), templates);
 *
 * @example <caption>Loading templates into TemplateController after initialization.</caption>
 * const templateController = new TemplateController(new Ant());
 * templateController.loadTemplates([
 *   new Template('My Category', 'My Custom Template', '/path/to/my/template/files'),
 *   new Template('Service', 'My Other Custom Template', 'path/foo/bar')
 * ]);
 */
class TemplateController {
  /**
  * @param {!Ant} ant The {@link Ant} framework instance that is initializing
  * the controller.
  * @param {Array<Template>} templates An array of templates to be loaded.
  * @throws {AssertionError} If the "ant" param is not passed.
  */
  constructor(ant, templates) {
    assert(
      ant,
      'Could not initialize the template controller: param "ant" is required'
    );
    assert(
      ant instanceof require('../Ant'),
      'Could not initialize the template controller: param "ant" should be Ant'
    );
    assert(
      !templates || templates instanceof Array,
      'Could not initialize the template controller: param "templates" should \
be an array'
    );

    /**
    * Contains the {@link Ant} framework instance that initliazed the
    * template controller.
    * @type {Ant}
    * @private
    */
    this._ant = ant;

    /**
    * Contains the loaded templates.
    * @type {Map}
    * @private
    */
    this._templates = new Map();

    this._loadTemplatesFromPluginController();

    // Notice that templates from plugins can be overridden here
    // if category and name matches.
    if (templates) {
      this.loadTemplates(templates);
    }
  }

  /**
  * Contains the {@link Ant} framework instance that initliazed the
  * template controller.
  * @type {Ant}
  * @readonly
  */
  get ant() {
    return this._ant;
  }

  /**
  * Loads the framework templates from each of the loaded plugins.
  * @private
  */
  _loadTemplatesFromPluginController() {
    for (const plugin of this._ant.pluginController.plugins) {
      const pluginTemplates = this._ant.pluginController.getPluginTemplates(
        plugin
      );
      this.loadTemplates(pluginTemplates);
    }
  }

  /**
   * Loads the framework templates from the array provided.
   * The templates are stored in maps where the template category and name
   * are used as keys.
   *
   * @param {!Array<Template>} templates The array of {@link Template} to be loaded
   */
  loadTemplates(templates) {
    for (const pluginTemplate of templates) {
      if (!this._templates.has(pluginTemplate.category)) {
        this._templates.set(pluginTemplate.category, new Map());
      }

      this._templates.get(pluginTemplate.category).set(
        pluginTemplate.name,
        pluginTemplate
      );
    }
  }

  /**
  * Gets a specific template by its category and name.
  * @param {String} category The category of the template to be gotten.
  * @param {String} name The name of the template to be gotten.
  * @return {Template} The template object.
  */
  getTemplate(category, name) {
    const templateCategory = this._templates.get(category);
    if (templateCategory) {
      const template = templateCategory.get(name);
      if (template) {
        return template;
      }
    }
    return null;
  }

  /**
   * Returns an array with all {@link Template} loaded by the
   * {@link TemplateController}.
   *
   * @returns {Array} An array containing all templates loaded by this
   * controller.
   */
  getAllTemplates() {
    const templates = [];
    this._templates.forEach(categoryMap => {
      categoryMap.forEach(({ category, name, path }) => {
        templates.push(new Template(category, name, path));
      });
    });
    return templates;
  }
}

module.exports = TemplateController;
