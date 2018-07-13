/**
 * @fileoverview Defines and exports the {@link Template} class.
 */

/**
 * Represents a template for the Ant Framework.
 */
class Template {
  /**
   * @param {!String} category The template category.
   * @param {!String} name The template name.
   * @throws {Error} If "category" and "name" params are not String.
   */
  constructor(category, name) {
    if (typeof category !== 'string') {
      throw new Error(
        'Could not initialize Template class: param "category" should be String'
      );
    }
    this._category = category;
    if (typeof name !== 'string') {
      throw new Error(
        'Could not initialize Template class: param "name" should be String'
      );
    }
    this._name = name;
  }

  /**
   * Contains the template category.
   * @type {String}
   * @readonly
   */
  get category() {
    return this._category;
  }

  /**
   * Contains the template name.
   * @type {String}
   * @readonly
   */
  get name() {
    return this._name;
  }
}

module.exports = Template;
