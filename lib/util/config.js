/**
 * @fileoverview Defines an util module to help handling the configuration files.
 */

const assert = require('assert');
const path = require('path');
const Template = require('../templates/Template');

/**
 * Parses the framework templates from the config file templates object.
 *
 * @param {Object} templatesConfig An object with following structure:
 *   {
 *     <Category_Name>: {
 *       <Template_Name> : <Template_Path>,
 *       ...
 *     },
 *     ...
 *   }
 * @param {String} basePath The base path defined in the configuration file.
 * This is used to define the template files path, in case it is relative.
 */
const parseConfigTemplates = (templatesConfig, basePath) => {
  const parsedTemplates = [];
  if (templatesConfig) {
    assert(typeof templatesConfig === 'object', 'Error while loading templates \
from Ant\'s config file. The "template" configuration should be an object!');

    // Iterates over categories found on the config file
    for (const category in templatesConfig) {
      const templates = templatesConfig[category];
      assert(typeof templates === 'object', 'Error while loading templates from \
Ant\'s config file: Template category value is not an object!');
      // Iterates over templates from current category
      for (const template in templates) {
        let templatePath = templates[template];
        // If there is a base path, and our template path is not absolute
        // we must append the base into our template path.
        if (basePath && !templatePath.startsWith('/')) {
          templatePath = path.resolve(basePath, templatePath);
        }
        parsedTemplates.push(new Template(category, template, templatePath));
      }
    }
  }
  return parsedTemplates;
};

module.exports = {
  parseConfigTemplates
};
