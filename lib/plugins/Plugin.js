class Plugin {
  get name() {
    return Plugin.getPluginName(this);
  }

  static getPluginName(plugin) {
    if (!plugin) {
      throw new Error(
        'Could not get plugin name: param "plugin" should be Object'
      );
    }
    return plugin.constructor.name;
  }
}

module.exports = Plugin;
