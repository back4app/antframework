/**
 * Exports the {@link Ant} class that can be used to initialize the framework
 * and the {@link Plugin} class that can be used to extend the framework.
 * @module antframework
 */

const Ant = require('./lib/Ant');
const Plugin = require('./lib/plugins/Plugin');

module.exports.Ant = Ant;
module.exports.Plugin = Plugin;
