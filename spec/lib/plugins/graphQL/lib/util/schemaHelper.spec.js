/**
 * @fileoverview Tests for lib/plugins/graphQL/lib/util/schemaHelper.js file.
 */

const path = require('path');
const Ant = require('../../../../../../lib/Ant');
const GraphQL = require('../../../../../../lib/plugins/graphQL/lib/GraphQL');
const schemaHelper = require(
  '../../../../../../lib/plugins/graphQL/lib/util/schemaHelper'
);

describe('lib/util/schemaHelper.js', () => {
  test('should export generateSchema function', () => {
    expect(schemaHelper.generateSchema).toEqual(expect.any(Function));
    const basePath = path.resolve(
      __dirname,
      '../../../../../support/services/FooService'
    );
    const ant = new Ant({ basePath });
    const graphQL = new GraphQL(ant, { basePath });
    const schema = schemaHelper.generateSchema(ant, graphQL);
    expect(schema.constructor.name).toEqual('GraphQLSchema');
  });
});
