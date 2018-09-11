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
    graphQL.directiveController.loadDirectives(graphQL.directives);
    const schema = schemaHelper.generateSchema(ant, graphQL);
    expect(schema.constructor.name).toEqual('GraphQLSchema');
  });

  test('should invoke subscribe directive resolver', () => {
    const basePath = path.resolve(
      __dirname,
      '../../../../../support/services/FooService'
    );
    const ant = new Ant({ basePath });
    const graphQL = new GraphQL(ant, { basePath });
    graphQL.directiveController.loadDirectives(graphQL.directives);
    const subscribeResolverMock = jest.fn();
    graphQL.directiveController.getDirective('subscribe')._resolver = {
      run: subscribeResolverMock
    };
    const schema = schemaHelper.generateSchema(ant, graphQL);
    const subscriptions = schema._typeMap['Subscription'];
    const mySubsField = subscriptions._fields['mySubs'];
    expect(mySubsField.astNode.directives[0].name.value).toBe('subscribe');
    expect(typeof mySubsField.subscribe).toBe('function');

    const field = { fieldName: 'foo'};
    const fieldArgs = ['foo', 'bar'];
    mySubsField.subscribe(null, fieldArgs, null, field);
    expect(subscribeResolverMock).toHaveBeenCalledWith(graphQL.ant, field, { to: 'mySubsResolver' }, fieldArgs);
  });
});
