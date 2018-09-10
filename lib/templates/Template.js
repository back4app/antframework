/**
 * @fileoverview Defines and exports the {@link Template} class.
 */

const assert = require('assert');
const path = require('path');
const util = require('util');
const fs = require('fs-extra');
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
   * @throws {AssertionError} If "category", "name" or "path" params are not
   * String.
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

    const templateFilesPath = this._getResolvedTemplatePath();
    assert(templateFilesPath, `Failed to render template ${this.name} \
of category ${this.category}. No valid path found to read template files`);
    logger.log(`Using path ${templateFilesPath} to render template`);

    const fileStat = fs.lstatSync(templateFilesPath);
    // If the template represents a single file, ensure the outPath directory
    // exists and then renders the template file
    if (fileStat.isFile()) {
      await fs.ensureDir(path.dirname(outPath));
      return this._renderTemplateFile(
        templateFilesPath,
        data,
        outPath
      );
    }
    assert(
      !fs.existsSync(outPath),
      `Could not render template: path "${outPath}" already exists`
    );
    await this._renderTemplateFiles(data, templateFilesPath, outPath);
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
   * @private
   */
  async _renderTemplateFiles(data, currentPath, outPath) {
    logger.log(`Creating output directory "${outPath}"`);
    await fs.ensureDir(outPath);

    logger.log(`Reading template directory "${this.path}"`);
    return Promise.all(fs.readdirSync(currentPath).map(async (templateFile) => {
      const templateFilePath = path.resolve(currentPath, templateFile);

      logger.log(`Checking if "${templateFile}" is a directory`);
      const templateFileStat = fs.lstatSync(templateFilePath);
      const isDirectory = templateFileStat.isDirectory();
      if (isDirectory) {
        const subDirectoryOutPath = path.resolve(outPath, templateFile);
        // Recursive call to render all subdirectory files
        return this._renderTemplateFiles(data, templateFilePath, subDirectoryOutPath);
      } else if (!templateFileStat.isFile()) {
        return;
      }
      // Removes the ".mustache" suffix
      if (templateFile.endsWith('.mustache')) {
        templateFile = templateFile.substring(0, templateFile.lastIndexOf('.mustache'));
      }
      await this._renderTemplateFile(
        templateFilePath,
        data,
        path.resolve(outPath, templateFile)
      );
    }));
  }

  /**
   * Renders a single file into the target path. If the file being rendered
   * is a Mustache template, renders it using the Mustache engine
   *
   * @param {!String} templateFilePath The path to the file that will be rendered
   * @param {Object} data The data that will be used to render the template
   * @param {!String} outPath The rendered file path
   */
  async _renderTemplateFile(templateFilePath, data, outPath) {
    logger.log(`Reading template file "${templateFilePath}"`);
    const templateFileContent = await readFile(templateFilePath, 'utf8');
    let outFileContent = templateFileContent;

    // If is Mustache template, updates outFileContent with rendered content
    if (templateFilePath.endsWith('.mustache')) {
      // Uses Mustache engine to render the template content using data
      logger.log(`Rendering template file "${templateFilePath}"`);
      outFileContent = Mustache.render(templateFileContent, data);
    }
    logger.log(`Writing output file "${outPath}"`);
    await writeFile(outPath, outFileContent);
  }

  /**
   * Checks if the template path exists, if not, assumes it
   * is a relative path and tries to resolve it.
   *
   * @returns {String} Returns a existant path or null
   * if none has been found.
   * @private
   */
  _getResolvedTemplatePath() {
    let templateFilesPath;
    if (fs.existsSync(this.path)) {
      templateFilesPath = this.path;
    } else {
      logger.log(`Directory ${this.path} from template ${this.name} \
does not exist. Checking other directories`);
      templateFilesPath = [
        process.cwd(),
        path.resolve(__dirname, '../../')
      ]
        .map(filePath => path.resolve(filePath, this.path))
        .find((filePath => {
          logger.log(`Checking if directory ${filePath} exists`);
          return fs.existsSync(filePath);
        }));
    }
    return templateFilesPath;
  }
}

module.exports = Template;
