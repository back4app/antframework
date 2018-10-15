/**
 * Exports the {@link GraphQL} plugin class.
 * @module ant-graphql
 */

const GraphQL = require('./lib/GraphQL');
const Directive = require('./lib/directives/Directive');
const schemaHelper = require('./lib/util/schemaHelper');

module.exports = GraphQL;
module.exports.Directive = Directive;
module.exports.schemaHelper = schemaHelper;
