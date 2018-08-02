/**
 * @fileoverview Defines and exports a {@link FooPlugin} {@link Plugin} class
 * for testing purposes.
 */

const Plugin = require('../../../lib/plugins/Plugin');

/**
 * Represents a foo {@link Plugin} implementation for testing purposes.
 * @extends Plugin
 * @private
 */
class FooPlugin extends Plugin {
  /**
  * @param {!Ant} ant The {@link Ant} instance that is loading the plugin.
  * @param {Object} config The config settings for the foo plugin.
  * @param {String} config.basePath The base path to be used by the plugin.
  * @param {} config.a A foo config setting called a.
  * @param {} config.b A foo config setting called b.
  * @param {} config.c A foo config setting called c.
  */
  constructor(ant, config) {
    super(ant, config);

    /**
     * Contains a foo member called a.
     * @type {}
     */
    this.a = null;

    /**
     * Contains a foo member called b.
     * @type {}
     */
    this.b = null;

    /**
     * Contains a foo member called c.
     * @type {}
     */
    this.c = null;

    if (config) {
      const { a, b, c } = config;
      this.a = a;
      this.b = b;
      this.c = c;
    }
  }
}

module.exports = FooPlugin;
