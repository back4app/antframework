/**
 * @fileoverview Tests for lib/plugins/graphQL/lib/GraphQL.js file.
 */

const Ant = require('../../../../../lib/Ant');
const Plugin = require('../../../../../lib/plugins/Plugin');
const GraphQL = require('../../../../../lib/plugins/graphql/lib/GraphQL');

const ant = new Ant();

describe('lib/plugins/graphQL/lib/GraphQL.js', () => {
  test('should export "GraphQL" class extending "Plugin" class', () => {
    const graphQL = new GraphQL(ant);
    expect(graphQL.constructor.name).toEqual('GraphQL');
    expect(graphQL).toBeInstanceOf(Plugin);
    expect(graphQL.name).toEqual('GraphQL');
  });
});
