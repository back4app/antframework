/**
 * @fileoverview Defines and exports the {@link TemplateController} class.
 */

/**
 * Represents a controller for the Ant Framework's templates.
 */
class TemplateController {
  /**
  * @param {!Ant} ant The {@link Ant} framework instance that is initializing
  * the controller.
  * @throws {Error} If the "ant" param is not passed.
  */
  constructor(ant) {
    if (!ant) {
      throw new Error(
        'Could not initialize the template controller: param "ant" is \
required'
      );
    } else if (!(ant instanceof require('../Ant'))) {
      throw new Error(
        'Could not initialize the template controller: param "ant" should be \
Ant'
      );
    }

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

    this._loadTemplates();
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
  * Loads the framework plugins from each of the loaded plugins.
  * @private
  */
  _loadTemplates() {
    for (const plugin of this._ant.pluginController.plugins) {
      const pluginTemplates = this._ant.pluginController.getPluginTemplates(
        plugin
      );

      for (const pluginTemplate of pluginTemplates) {
        if (!this._templates.has(pluginTemplate.category)) {
          this._templates.set(pluginTemplate.category, new Map());
        }

        this._templates.get(pluginTemplate.category).set(
          pluginTemplate.name,
          pluginTemplate
        );
      }
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
}

module.exports = TemplateController;
