/**
 * @fileoverview Defines and exports the {@link Template} class.
 */

const path = require('path');
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const Mustache = require('mustache');

/**
 * Represents a template for the Ant Framework.
 */
class Template {
  /**
   * @param {!String} category The template category.
   * @param {!String} name The template name.
   * @param {!String} path The template path.
   * @throws {Error} If "category" and "name" params are not String.
   */
  constructor(category, name, path) {
    if (typeof category !== 'string') {
      throw new Error(
        'Could not initialize Template class: param "category" should be String'
      );
    }

    /**
     * Contains the template category.
     * @type {String}
     * @private
     */
    this._category = category;

    if (typeof name !== 'string') {
      throw new Error(
        'Could not initialize Template class: param "name" should be String'
      );
    }

    /**
     * Contains the template name.
     * @type {String}
     * @private
     */
    this._name = name;

    if (typeof path !== 'string') {
      throw new Error(
        'Could not initialize Template class: param "path" should be String'
      );
    }

    /**
     * Contains the template path.
     * @type {String}
     * @private
     */
    this._path = path;
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

  /**
   * Contains the template path.
   * @type {String}
   * @readonly
   */
  get path() {
    return this._path;
  }

  /**
   * Renders the template.
   * @param {!String} outPath The output path to which the template will be
   * rendered.
   * @param {Object} data The data that will be used to render the template.
   * @throws {Error} If "outPath" param is not String.
   * @async
   */
  async render(outPath, data) {
    if (typeof outPath !== 'string') {
      throw new Error(
        'Could not render template: param "outPath" should be String'
      );
    }
    else if (fs.existsSync(outPath)) {
      throw new Error(
        `Could not render template: path "${outPath}" already exists`
      );
    }

    fs.mkdirSync(outPath);

    await Promise.all(fs.readdirSync(this.path).map(async (templateFile) => {
      const templateFilePath = path.resolve(this.path, templateFile);
      const templateFileContent = await readFile(templateFilePath, 'utf8');
      let outFileContent = templateFileContent;
      templateFile = templateFile.split('.mustache');
      if (templateFile.length) {
        outFileContent = Mustache.render(templateFileContent, data);
      }
      const outFilePath = path.resolve(outPath, templateFile[0]);
      await writeFile(outFilePath, outFileContent);
    }));
  }
}

module.exports = Template;
