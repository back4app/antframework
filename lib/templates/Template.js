/**
 * @fileoverview Defines and exports the {@link Template} class.
 */

const path = require('path');
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const Mustache = require('mustache');
const logger = require('../util/logger');

/**
 * Represents a template for the Ant Framework.
 *
 * A template represents any content that could generate replicas based
 * on its files, modifying its content based on the data provided at
 * rendering time.
 * Any files located at the template path (including subpaths) is part
 * of the template.
 * The category and name attributes are used for identification and
 * better classification.
 */
class Template {
  /**
   * @param {!String} category The template category.
   * @param {!String} name The template name.
   * @param {!String} path The template path.
   * @throws {Error} If "category", "name" and "path" params are not String.
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
    await this._renderTemplateFiles(data, this.path, outPath);
  }

  /**
   * Renders the template files from currentPath. If the file is a Mustache
   * template, renders it with data parameter given, otherwise, just copies
   * the file to outPath.
   * To render all currentPath subdirectories files, it makes a recursive call.
   *
   * This function assumes outPath never exists, so the first thing it does is
   * the directory creation.
   *
   * @async
   * @param {Object} data The data that will be used to render the template.
   * @param {String} currentPath The current path of template files.
   * @param {String} outPath The output path to which the template will be rendered.
   */
  async _renderTemplateFiles(data, currentPath, outPath) {
    logger.log(`Creating output directory "${outPath}"`);
    fs.mkdirSync(outPath);

    logger.log(`Reading template directory "${this.path}"`);
    return Promise.all(fs.readdirSync(currentPath).map(async (templateFile) => {
      const templateFilePath = path.resolve(currentPath, templateFile);

      logger.log(`Checking if "${templateFile}" is a directory`);
      const isDirectory = fs.lstatSync(templateFilePath).isDirectory();
      if (isDirectory) {
        const subDirectoryOutPath = path.resolve(outPath, templateFile);
        // Recursive call to render all subdirectory files
        return this._renderTemplateFiles(data, templateFilePath, subDirectoryOutPath);
      }
      logger.log(`Reading template file "${templateFilePath}"`);
      const templateFileContent = await readFile(templateFilePath, 'utf8');
      let outFileContent = templateFileContent;

      // If is Mustache template, updates outFileContent with rendered content
      if (templateFile.endsWith('.mustache')) {
        // Removes ".mustache" suffix
        templateFile = templateFile.substring(0, templateFile.lastIndexOf('.mustache'));

        // Uses Mustache engine to render the template content using data
        logger.log(`Rendering template file "${templateFilePath}"`);
        outFileContent = Mustache.render(templateFileContent, data);
      }
      const outFilePath = path.resolve(outPath, templateFile);
      logger.log(`Writing output file "${outFilePath}"`);
      await writeFile(outFilePath, outFileContent);
    }));
  }
}

module.exports = Template;
