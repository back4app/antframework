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
const yaml = require('yaml').default;
const Map = require('yaml/dist/schema/Map').default;
const Pair = require('yaml/dist/schema/Pair').default;
const Seq = require('yaml/dist/schema/Seq').default;

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
 * @param {!Ant} ant The {@link Ant} instance that is loading the plugin.
 * @param {Object} config The config settings for the core plugin.
 * @param {String} config.basePath The base path to be used by the plugin.
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
          'add <plugin> [--global]',
          'Adds new plugin', yargs => {
            yargs.positional('plugin', {
              describe: 'The plugin to be added',
              string: true
            }).option('global', {
              alias: 'g',
              describe: 'Adds plugin into global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              await this.addPlugin(argv.plugin, argv.global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'plugin add');
            }
          }
        ).command(
          'remove <plugin> [--global]',
          'Removes a plugin', yargs => {
            yargs.positional('plugin', {
              describe: 'The plugin to be removed',
              string: true
            }).option('global', {
              alias: 'g',
              describe: 'Removes plugin from global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              await this.removePlugin(argv.plugin, argv.global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'plugin remove');
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
    let command = null;
    const { argv } = process;
    if (msg) {
      if (argv.includes('create')) {
        command = 'create';
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
      } else if (argv.includes('plugin')) {
        const pluginCommand = argv[argv.indexOf('plugin') + 1];
        switch(pluginCommand) {
        case 'add':
          command = 'plugin add';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Plugin add command requires plugin argument';
            createError = true;
          }
          break;
        case 'remove':
          command = 'plugin remove';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Plugin remove command requires plugin argument';
            createError = true;
          }
          break;
        }
      }
      if (createError) {
        yargsHelper.handleErrorMessage(msg, null, command);
      }
    }
  }

  /**
   * Creates a new service.
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
   * Adds a plugin into a configuration file
   *
   * @param {!String} plugin The path to the plugin files
   * @param {Boolean} isGlobal Checked if the plugin should be added on
   * the global configuration file. If not, the plugin will be added on
   * the local configuration file.
   * @returns {String} The path to the configuration file or null if nothing
   * was done.
   */
  async addPlugin(plugin, isGlobal) {
    assert(plugin, 'Could not add plugin: param "plugin" is required');
    assert(
      typeof plugin === 'string',
      'Could not add plugin: param "plugin" should be String'
    );
    let config = isGlobal ? this._getGlobalConfig() : this._getLocalConfig();
    if (!config) {
      config = new yaml.Document();
    }
    if (!config.contents) {
      config.contents = new Map();
    }
    let plugins = config.contents.items.find(item => item.key.value === 'plugins');
    if (!plugins) {
      plugins = new Pair('plugins', new Seq());
      config.contents.items.push(plugins);
    }
    if (plugins.value && plugins.value.items && plugins.value.items.find(item => item.value === plugin)) {
      console.log(`Plugin "${plugin}" already found on current config. \
plugin add command should do nothing`);
      return null;
    }
    logger.log(`Adding plugin ${plugin} into ${isGlobal ? 'global' : 'local'} \
configuration file`);
    plugins.value.items.push(plugin);
    const configFileContent = config.toString();
    const path = isGlobal ? this._getGlobalConfigPath() : this._getLocalConfigPath();
    fs.writeFileSync(path, configFileContent);
    logger.log(`Configutarion file successfully written in ${path}`);
    logger.log(`Content written:\n${configFileContent}`);
    console.log(`Plugin "${plugin}" successfully added ${isGlobal ? 'globally' : ''}`);
    return path;
  }

  /**
   * @param {!String} plugin The path of the plugin to be removed
   * @param {Boolean} isGlobal Checked if the plugin should be removed from
   * the global configuration file. If not, the plugin will be removed from
   * the local configuration file.
   * @returns {String} The path to the configuration file or null if nothing
   * was done.
   */
  async removePlugin(plugin, isGlobal) {
    assert(plugin, 'Could not remove plugin: param "plugin" is required');
    assert(
      typeof plugin === 'string',
      'Could not remove plugin: param "plugin" should be String'
    );
    const config = isGlobal ? this._getGlobalConfig() : this._getLocalConfig();
    if (!config || !config.contents) {
      console.log('Configuration not found. plugin remove command should do nothing');
      return null;
    }
    const plugins = config.contents.items && config.contents.items.find(
      item => item.key.value === 'plugins'
    );
    if (!plugins || !plugins.value || !plugins.value.items) {
      console.log(`No plugins was found on ${isGlobal ? 'global' : 'local'} \
configuration file. plugin remove command should do nothing`);
      return null;
    }
    if (!plugins.value.items.find(item => item.value === plugin)) {
      console.log(`Plugin "${plugin}" was not found on ${isGlobal ? 'global' : 'local'} \
configuration file. plugin remove command should do nothing`);
      return null;
    }
    plugins.value.items = plugins.value.items.filter(item => item.value !== plugin);
    const configFilePath = isGlobal ? this._getGlobalConfigPath() : this._getLocalConfigPath();
    fs.writeFileSync(configFilePath, config.toString());
    console.log(`Plugin "${plugin}" successfully removed ${isGlobal ? 'globally' : ''}`);
    return isGlobal ? this._getGlobalConfigPath() : this._getLocalConfigPath();
  }

  /**
   * Reads a configuration file, and parses it to create a {@link yaml.Document}
   * instance and return. Returns null if the configuration file is empty.
   *
   * @param {@} configFilePath The configuration file path
   * @returns {Object} A {@link yaml.Document} parsed from the contents
   * of the configuration file.
   * @private
   */
  _getConfig (configFilePath) {
    const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
    if (!configFileContent) {
      return null;
    }
    return yaml.parseDocument(configFileContent);
  }

  /**
   * Gets the resolved path to the local configuration file.
   *
   * @returns {String} The file path to the local configuration file.
   * @private
   */
  _getLocalConfigPath () {
    return path.resolve(process.cwd(), 'ant.yml');
  }

  /**
   * Parses and returns the {@link yaml.Document} from the local configuration file.
   *
   * @returns {Object} The parsed {@link yaml.Document} from the local configuration.
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
        config = new yaml.Document();
      }
    }
    return config;
  }

  /**
   * Gets the resolved path to the global configuration file.
   * It assumes the globalConfig.yml is at the lib directory of Ant.
   *
   * @returns {String} The file path to the global configuration file.
   * @private
   */
  _getGlobalConfigPath () {
    return path.resolve(__dirname, '../../../', 'globalConfig.yml');
  }

  /**
   * Parses and returns the {@link yaml.Document} from the global configuration file.
   *
   * @returns {Object} The parsed {@link yaml.Document} from the global configuration.
   * @throws {AntError} If the configuration file was not found or an error occurred
   * while parsing the YAML.
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
