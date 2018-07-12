/**
 * Exports the {@link Ant} class that can be used to initialize the framework,
 * the {@link Plugin} class that can be used to extend the framework and the
 * default {@link Core} plugin that can be also extended.
 * @module antframework
 */

const Ant = require('./lib/Ant');
const Plugin = require('./lib/plugins/Plugin');
const Core = require('./lib/plugins/core');

module.exports.Ant = Ant;
module.exports.Plugin = Plugin;
module.exports.Core = Core;
