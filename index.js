/**
 * Exports the {@link Ant} class that can be used to initialize and run the
 * framework functionalities. It additionally exports the following artifacts
 * that can be used to extend the framework:
 * - The {@link Plugin} class that can be used to create new plugins.
 * - The {@link Template} class that can be used to create new templates.
 * - The {@link Core} plugin that can be extended.
 * - The {@link GraphQL} plugin that can be extended.
 * - The [antframework/lib/util]{@link module:antframework/lib/util} module that can be used when extending
 * the framework.
 * @module antframework
 */

const Ant = require('./lib/Ant');
const Plugin = require('./lib/plugins/Plugin');
const Template = require('./lib/templates/Template');
const Core = require('./lib/plugins/core');
const GraphQL = require('./lib/plugins/graphQL');
const util = require('./lib/util');

module.exports.Ant = Ant;
module.exports.Plugin = Plugin;
module.exports.Template = Template;
module.exports.Core = Core;
module.exports.GraphQL = GraphQL;
module.exports.util = util;
