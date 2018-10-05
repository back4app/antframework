/**
 * @fileoverview Defines and exports the {@link TemplatesPathResolver} class.
 */

const path = require('path');
const ConfigJSONHandler = require('./ConfigJSONHandler');

/**
 * @class ant/TemplatesPathResolver
 * Represents a resolver to lead with the templates configuration.
 * @extends ConfigJSONHandler
 */
class TemplatesPathResolver extends ConfigJSONHandler {
  /**
   * Resolves the templates paths if they are not absolute.
   *
   * @param {Array} templates The templates array from the configuration JSON whose
   * template paths shall be updated.
   * @param {String} basePath The base path of this configuration that will be
   * used to resolve the relative paths.
   */
  _resolveTemplatesPaths({ templates, basePath }) {
    if (templates) {
      for (const category of Object.values(templates)) {
        for (const [templateName, templatePath] of Object.entries(category)) {
          if (!templatePath.startsWith('/')) {
            category[templateName] = path.resolve(basePath, templatePath);
          }
        }
      }
    }
  }

  handle(json) {
    this._resolveTemplatesPaths(json);
  }
}

module.exports = TemplatesPathResolver;
