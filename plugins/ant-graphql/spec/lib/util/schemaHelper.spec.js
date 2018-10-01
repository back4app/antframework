/**
 * @fileoverview Tests for lib/util/schemaHelper.js file.
 */

const path = require('path');
const { logger } = require('@back4app/ant-util');
const { AntFunction, Ant } = require('@back4app/ant');
const Directive = require('../../../lib/directives/Directive');
const GraphQL = require('../../../lib/GraphQL');
const schemaHelper = require(
  '../../../lib/util/schemaHelper'
);

const utilPath = path.resolve(
  __dirname,
  '../../../node_modules/@back4app/ant-util-tests'
);

describe('lib/util/schemaHelper.js', () => {
  test('should export generateSchema function', () => {
    expect(schemaHelper.generateSchema).toEqual(expect.any(Function));
    const basePath = path.resolve(
      utilPath,
      'services/FooService'
    );
    const ant = new Ant({ basePath });
    const graphQL = new GraphQL(ant, { basePath });
    graphQL.directiveController.loadDirectives(graphQL.directives);
    const schema = schemaHelper.generateSchema(ant, graphQL);
    expect(schema.constructor.name).toEqual('GraphQLSchema');
  });

  test('should invoke resolver', async () => {
    const basePath = path.resolve(
      utilPath,
      'services/FooService'
    );
    const ant = new Ant({ basePath });
    const graphQL = new GraphQL(ant, { basePath });
    ant.pluginController.loadPlugins([graphQL]);
    const schema = schemaHelper.generateSchema(ant, graphQL);
    const queries = schema._typeMap['Query'];
    const myQueryField = queries._fields['hello'];
    expect(myQueryField.astNode.directives[0].name.value).toBe('resolve');
    expect(typeof myQueryField.resolve).toBe('function');
    expect(await myQueryField.resolve(null, { name: 'Foo' })).toEqual(
      'Hello Foo from function!!!'
    );
  });

  test('should invoke resolver that returns Observable', async () => {
    const basePath = path.resolve(
      utilPath,
      'services/FooService'
    );
    const ant = new Ant({ basePath });
    const observableFunction = new AntFunction(
      ant,
      'observableQueryHello',
      (_, __, fieldArgs) => {
        return require(path.resolve(basePath, 'observableQueryHello'))(
          fieldArgs
        );
      }
    );
    ant.functionController.loadFunctions([observableFunction]);
    const graphQL = new GraphQL(ant, { basePath });
    graphQL.directiveController.loadDirectives([
      new Directive(
        ant,
        'observableResolve',
        '',
        observableFunction
      )
    ]);
    ant.pluginController.loadPlugins([graphQL]);
    const schema = schemaHelper.generateSchema(ant, graphQL);
    const queries = schema._typeMap['Query'];
    const myQueryField = queries._fields['hello2'];
    expect(myQueryField.astNode.directives[0].name.value)
      .toBe('observableResolve');
    expect(typeof myQueryField.resolve).toBe('function');
    expect(await myQueryField.resolve(null, { name: 'Foo' })).toEqual(
      'Hello Foo from function!!!'
    );
  });

  test('should not pass ant if resolver is not AntFunction', async () => {
    const basePath = path.resolve(
      utilPath,
      'services/FooService'
    );
    const ant = new Ant({ basePath });
    const observableFunction = new AntFunction(
      ant,
      'observableQueryHello',
      (_, __, fieldArgs) => {
        return require(path.resolve(basePath, 'observableQueryHello'))(
          fieldArgs
        );
      }
    );
    ant.functionController.loadFunctions([observableFunction]);
    const graphQL = new GraphQL(ant, { basePath });
    const observableDirective = new Directive(
      ant,
      'observableResolve',
      '',
      observableFunction
    );
    observableDirective._resolver = {
      run: (ant, __, fieldArgs) => {
        expect(ant).toEqual(undefined);
        return require(path.resolve(basePath, 'observableQueryHello'))(
          fieldArgs
        );
      }
    };
    graphQL.directiveController.loadDirectives([observableDirective]);
    ant.pluginController.loadPlugins([graphQL]);
    const schema = schemaHelper.generateSchema(ant, graphQL);
    const queries = schema._typeMap['Query'];
    const myQueryField = queries._fields['hello2'];
    expect(myQueryField.astNode.directives[0].name.value)
      .toBe('observableResolve');
    expect(typeof myQueryField.resolve).toBe('function');
    expect(await myQueryField.resolve(null, { name: 'Foo' })).toEqual(
      'Hello Foo from function!!!'
    );
  });

  test('should invoke subscribe directive resolver', () => {
    const basePath = path.resolve(
      utilPath,
      'services/FooService'
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

  test('should return null if there is no model', () => {
    const basePath = path.resolve(
      utilPath,
      'services/FooService'
    );
    const ant = new Ant({ basePath });
    const graphQL = new GraphQL(ant, { basePath });
    expect(schemaHelper.generateSchema(ant, graphQL, '')).toEqual(null);
  });

  test('should work without GraphQL plugin', () => {
    const basePath = path.resolve(
      utilPath,
      'services/FooService'
    );
    const ant = new Ant({ basePath });
    expect(schemaHelper.generateSchema(ant, undefined, '')).toEqual(null);
    expect(schemaHelper.generateSchema(
      ant,
      undefined,
      `
        schema {
          query: Query
        }

        type Query {
          hello: String @foo
        }
      `
    )).not.toEqual(null);
  });

  test('should log error when validating schema', () => {
    const mockedError = jest.fn();
    logger.attachErrorHandler(mockedError);
    const basePath = path.resolve(
      utilPath,
      'services/FooService'
    );
    const ant = new Ant({ basePath });
    const graphQL = new GraphQL(ant, { basePath });
    schemaHelper.generateSchema(
      ant,
      graphQL,
      `
        schema { query: Query }
        type Query {
          __hello: String
        }
      `
    );
    expect(mockedError).toHaveBeenCalledWith(expect.stringContaining(
      'There were some errors when validating the GraphQL schema:'
    ));
    logger._errorHandlers.delete(mockedError);
  });
});
