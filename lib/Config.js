/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Config} class.
 */

const AntError = require('./util/AntError');
const assert = require('assert');
const fs = require('fs');
const logger = require('./util/logger');
const path = require('path');
const yaml = require('yaml').default;
const Map = require('yaml/dist/schema/Map').default;
const Pair = require('yaml/dist/schema/Pair').default;
const Scalar = require('yaml/dist/schema/Scalar').default;
const Seq = require('yaml/dist/schema/Seq').default;

/**
 * Represents the configuration of the {@link Ant} class.
 * It was created to simplify the process of manipulating configuration files,
 * making it easier to retrieve and save new configurations.
 */
class Config {
  constructor(path) {
    assert(path, 'Configuration file path can not be undefined');
    assert(typeof path === 'string', 'Configuration file path must be a \
string');
    this._path = path;
    if (fs.existsSync(path)) {
      const configFileContent = fs.readFileSync(path, 'utf-8');
      // If file is empty, does not try to parse it.
      if (configFileContent) {
        try {
          this._config = yaml.parseDocument(configFileContent);
          if(typeof this._config.toJSON() === 'string') {
            throw new AntError(`The configuration "${this._config.toJSON()}" is invalid`);
          }
          return;
        } catch (e) {
          throw new AntError(
            `Could not load config ${path}`,
            e
          );
        }
      }
    }
    logger.log(`Configuration file not found. Creating a brand new at \
path: ${path}`);
    this._config = new yaml.Document();
    this._config.contents = new Map();
    fs.writeFileSync(path, this._config.toString());
    logger.log(`Configuration file successfully written at: ${path}`);
  }

  /**
   * Retrieve the file path of this configuration.
   *
   * @returns {String} the file path of this configuration
   */
  get path() {
    return this._path;
  }

  /**
   * Returns a JSON representation of this configuration.
   *
   * @returns {Object} the JSON representation of this configuration
   */
  get config() {
    return this._config.toJSON();
  }

  /**
   * Adds the plugin into this configuration.
   *
   * @param {!String} plugin The path to the plugin files
   * @returns {Config} This configuration instance.
   */
  addPlugin(plugin) {
    assert(plugin, 'Could not add plugin: param "plugin" is required');
    assert(
      typeof plugin === 'string',
      'Could not add plugin: param "plugin" should be String'
    );

    let plugins = this._config.contents.items.find(
      item => item.key.value === 'plugins'
    );
    if (!plugins) {
      plugins = new Pair(new Scalar('plugins'), new Seq());
      this._config.contents.items.push(plugins);
    }
    if (plugins.value && plugins.value.items && plugins.value.items.find(
      item => item.value === plugin
    )) {
      console.log(`Plugin "${plugin}" already found on current config. \
plugin add command should do nothing`);
      return this;
    }
    logger.log(`Adding plugin ${plugin} into configuration file ${this._path}`);
    plugins.value.items.push(new Scalar(plugin));
    console.log(`Plugin "${plugin}" successfully added on configuration file ${this._path}`);
    return this;
  }

  /**
   * Removes the plugin from this configuration.
   *
   * @param {!String} plugin The path to the plugin files
   * @returns {Config} This configuration instance.
   */
  removePlugin(plugin) {
    assert(plugin, 'Could not remove plugin: param "plugin" is required');
    assert(
      typeof plugin === 'string',
      'Could not remove plugin: param "plugin" should be String'
    );
    const plugins = this._config.contents.items.find(item => item.key.value === 'plugins');
    if (!plugins || !plugins.value || !plugins.value.items) {
      console.log('No plugins was found on configuration file. plugin \
remove command should do nothing');
      return this;
    }
    if (!plugins.value.items.find(item => item === plugin || item.value)) {
      console.log(`Plugin "${plugin}" was not found on configuration file. \
plugin remove command should do nothing`);
      return this;
    }
    plugins.value.items = plugins.value.items.filter(item => item.value !== plugin);
    console.log(`Plugin "${plugin}" successfully removed from configuration file ${this._path}`);
    return this;
  }

  /**
   * Writes this configuration content to the file.
   *
   * @returns {String} The file path of this configuration.
   */
  save() {
    const configFileContent = this._config.toString();
    fs.writeFileSync(this._path, configFileContent);
    logger.log(`Configutarion file successfully written in ${this._path}`);
    logger.log(`Content written:\n${configFileContent}`);
    return this._path;
  }

  /**
   * Returns the global configuration.
   *
   * @returns {Config} The global configuration.
   */
  static get GLOBAL () {
    return new Config(path.resolve(__dirname, 'globalConfig.yml'));
  }
}
module.exports = Config;
