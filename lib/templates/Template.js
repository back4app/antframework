/**
 * @fileoverview Defines and exports the {@link Template} class.
 */

const assert = require('assert');
const path = require('path');
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const Mustache = require('mustache');
const logger = require('../util/logger');

/**
 * Represents a template for the Ant Framework.
 */
class Template {
  /**
   * @param {!String} category The template category.
   * @param {!String} name The template name.
   * @param {!String} path The template path.
   * @throws {AssertionError} If "category", "name" and "path" params are not String.
   */
  constructor(category, name, path) {
    assert(
      typeof category === 'string',
      'Could not initialize Template class: param "category" should be String'
    );

    /**
     * Contains the template category.
     * @type {String}
     * @private
     */
    this._category = category;

    assert(
      typeof name === 'string',
      'Could not initialize Template class: param "name" should be String'
    );

    /**
     * Contains the template name.
     * @type {String}
     * @private
     */
    this._name = name;

    assert(
      typeof path === 'string',
      'Could not initialize Template class: param "path" should be String'
    );

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
   * @throws {AssertionError} If "outPath" param is not String or the output
   * path already exists.
   * @async
   */
  async render(outPath, data) {
    assert(
      typeof outPath === 'string',
      'Could not render template: param "outPath" should be String'
    );
    assert(
      !fs.existsSync(outPath),
      `Could not render template: path "${outPath}" already exists`
    );

    logger.log(`Creating output directory "${outPath}"`);
    fs.mkdirSync(outPath);

    logger.log(`Reading template directory "${this.path}"`);
    await Promise.all(fs.readdirSync(this.path).map(async (templateFile) => {
      const templateFilePath = path.resolve(this.path, templateFile);
      logger.log(`Reading template file "${templateFilePath}"`);
      const templateFileContent = await readFile(templateFilePath, 'utf8');
      let outFileContent = templateFileContent;
      templateFile = templateFile.split('.mustache');
      if (templateFile.length > 1) {
        logger.log(`Renderizing template file "${templateFilePath}"`);
        outFileContent = Mustache.render(templateFileContent, data);
      }
      const outFilePath = path.resolve(outPath, templateFile[0]);
      logger.log(`Writing output file "${outFilePath}"`);
      await writeFile(outFilePath, outFileContent);
    }));
  }
}

module.exports = Template;
