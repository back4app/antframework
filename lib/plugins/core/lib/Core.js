/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Core} plugin class.
 */

const AntError = require('../../../util/AntError');
const assert = require('assert');
const fs = require('fs');
const logger = require('../../../util/logger');
const path = require('path');
const yargsHelper = require('../../../util/yargsHelper');
const Plugin = require('../../Plugin');
const Template = require('../../../templates/Template');
const yaml = require('js-yaml');

const templates = [
  new Template(
    'Service',
    'Default',
    path.resolve(__dirname, '../templates/service/default')
  )
];

/**
 * Represents a plugin containing the Ant Framework's core functionalities.
 * @extends Plugin
 * @param {!Ant} ant The {@link Ant} framework instance that is loading the
 * plugin.
 */
class Core extends Plugin {
  get templates() {
    return templates;
  }

  loadYargsSettings(yargs) {
    yargs.command(
      'create <service> [--template <name>]',
      'Create a new service',
      {
        template: {
          alias: 't',
          describe: 'Specify the template for the new service',
          type: 'string',
          requiresArg: true,
          default: 'Default'
        }
      },
      async (argv) => {
        try {
          const outPath = await this.createService(argv.service, argv.template);
          console.log(
            `Service "${argv.service}" successfully created in "${outPath}" \
using template "${argv.template}"`
          );
          process.exit(0);
        } catch (e) {
          yargsHelper.handleErrorMessage(e.message, e, 'create');
        }
      }
    ).command(
      'plugin <command>',
      'Manage plugins of Ant framework', yargs => {
        yargs.command(
          'install <plugin> [--global]',
          'Installs new plugin', yargs => {
            yargs.positional('plugin', {
              describe: 'The plugin to be installed',
              string: true
            });
            yargs.option('global', {
              alias: 'g',
              describe: 'Installs plugin(s) into global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              await this.installPlugin(argv.plugin, argv.global);
              console.log(`Plugin "${argv.plugin}" successfully installed ${argv.global ? 'globally' : ''}`);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'plugin install');
            }
          }
        );
      }).fail(msg => this._yargsFailed(msg));
  }

  /**
   * Runs when the yargs fails to parse the argv and it is used to define custom
   * error messages.
   * @param {String} msg The original Yargs message.
   * @private
   */
  _yargsFailed(msg) {
    let createError = false;
    const { argv } = process;
    if (msg) {
      if (argv.includes('create')) {
        if (msg.includes('Not enough non-option arguments')) {
          msg = 'Create command requires service argument';
          createError = true;
        } else if (msg.includes('Unknown argument: templatename')) {
          msg = 'Create command only accepts 1 argument';
          createError = true;
        } else if (msg.includes('Not enough arguments following: template')) {
          msg = 'Template option requires name argument';
          createError = true;
        }
        if (createError) {
          yargsHelper.handleErrorMessage(msg, null, 'create');
        }
      } else if (argv.includes('plugin') && argv[argv.indexOf('plugin') + 1] === 'install') {
        if (msg.includes('Not enough non-option arguments')) {
          msg = 'Plugin install command requires plugin argument';
          createError = true;
        }
        if (createError) {
          yargsHelper.handleErrorMessage(msg, null, 'plugin install');
        }
      }
    }
  }

  /**
   * Creates a new service
   * @param {!String} name The new service name
   * @param {String} [template=Default] The name of the template to be used during the new
   * service creation.
   * @returns {String} The path to the new service.
   * @throws {AssertionError} If "name" and "template" params are not String.
   * @async
   */
  async createService(name, template) {
    assert(name, 'Could not create service: param "name" is required');
    assert(
      typeof name === 'string',
      'Could not create service: param "name" should be String'
    );

    const servicePath = path.resolve(
      process.cwd(),
      name.replace(/[^a-z0-9]/gi, '-')
    );

    if (!template) {
      template = 'Default';
    }
    assert(
      typeof template === 'string',
      'Could not create service: param "template" should be String'
    );

    const templateObject = this.ant.templateController.getTemplate(
      'Service',
      template
    );
    assert(
      templateObject instanceof Template,
      `Could not create service: template "${template}" was not found`
    );

    await templateObject.render(servicePath, { service: name });

    return servicePath;
  }

  /**
   * Installs the plugin into a configuration file
   *
   * @param {!String} plugin The path to the plugin files
   * @param {Boolean} isGlobal Checked if the plugin should be installed on
   * the global configuration file. If not, the plugin will be installed on
   * the local configuration file.
   * @returns {String} The path to the configuration file or null if nothing
   * was done.
   */
  async installPlugin(plugin, isGlobal) {
    assert(plugin, 'Could not install plugin: param "plugin" is required');
    assert(
      typeof plugin === 'string',
      'Could not install plugin: param "plugin" should be String'
    );
    let config = isGlobal ? this._getGlobalConfig() : this._getLocalConfig();
    if (!config) {
      config = {};
    }
    if (!config.plugins) {
      config.plugins = [];
    }
    if (config.plugins.includes(plugin)) {
      logger.log(`Plugin "${plugin}" already found on current config. \
plugin install command should do nothing.`);
      return null;
    }
    logger.log(`Installing plugin ${plugin} into ${isGlobal ? 'global' : 'local'} \
configuration file`);
    config.plugins.push(plugin);
    const configFileContent = yaml.safeDump(config);
    const path = isGlobal ? this._getGlobalConfigPath() : this._getLocalConfigPath();
    fs.writeFileSync(path, configFileContent);
    logger.log(`Configutarion file successfully written in ${path}`);
    logger.log(`Content written:\n${configFileContent}`);
    return path;
  }

  /**
   * @param {@} configFilePath
   * @private
   */
  _getConfig (configFilePath) {
    const configFileContent = fs.readFileSync(configFilePath);
    return yaml.safeLoad(configFileContent);
  }

  /**
   * @private
   */
  _getLocalConfigPath () {
    return path.resolve(process.cwd(), 'ant.yml');
  }

  /**
   * @private
   */
  _getLocalConfig () {
    let config = null;
    const configPath = this._getLocalConfigPath();
    if (fs.existsSync(configPath)) {
      try {
        config = this._getConfig(configPath);
      } catch (e) {
        throw new AntError(
          `Could not load config ${configPath}`,
          e
        );
      }
      if (!config) {
        logger.log(`Empty configuration file found at ${configPath}. Returning empty \
  config instance.`);
        config = {};
      }
    }
    return config;
  }

  /**
   * @private
   */
  _getGlobalConfigPath () {
    return path.resolve(__dirname, '../../../', 'globalConfig.yml');
  }

  /**
    * Returns the global config file.
    * @throws {AntError} If the default config file cannot be read.
    * @type {Object}
    * @private
    */
  _getGlobalConfig () {
    try {
      return this._getConfig(this._getGlobalConfigPath());
    } catch (e) {
      throw new AntError(
        `Could not load global config ${this._getGlobalConfigPath()}`,
        e
      );
    }
  }
}

module.exports = Core;
