const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const PluginController = require('./plugins/PluginController');

class Ant {
  constructor(config) {
    if (config) {
      this._config = config;
    } else {
      this._loadDefaultConfig();
    }

    this._pluginController = new PluginController(this._config.plugins);
  }

  _loadDefaultConfig() {
    const defaultConfigPath = path.resolve(`${__dirname}/defaultConfig.yml`);
    try {
      this._config = yaml.safeLoad(fs.readFileSync(defaultConfigPath, 'utf8'));
    } catch (e) {
      throw new Error(
        `Could not load default config ${defaultConfigPath}: ${e}`
      );
    }
  }

  get pluginController() {
    return this._pluginController;
  }
}

module.exports = Ant;
