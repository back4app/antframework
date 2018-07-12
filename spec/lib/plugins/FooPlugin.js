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
  * @param {Object} config The config settings for the foo plugin.
  * @param {} config.a A foo config setting called a.
  * @param {} config.b A foo config setting called b.
  * @param {} config.c A foo config setting called c.
  */
  constructor(config) {
    super();

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
