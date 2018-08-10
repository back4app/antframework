/**
 * Exports the {@link GraphQL} plugin class.
 * @module antframework/lib/plugins/graphQL
 */

const GraphQL = require('./lib/GraphQL');
const Directive = require('./lib/directives/Directive');

module.exports = GraphQL;
module.exports.Directive = Directive;
