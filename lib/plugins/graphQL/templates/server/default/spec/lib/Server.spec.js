/* eslint-disable no-console */

/**
 * @fileoverview Tests for GraphQL Server - lib/Server.js file.
 */

const path = require('path');
const http = require('http');
const { graphql } = require('graphql');
const { Config, util } = require('@back4app/antframework');
const { logger } = util;
const Server = require('../../lib/Server');

describe('GraphQL Server - lib/Server.js', () => {
  test('should export "Server" class', () => {
    const server = new Server();
    expect(server.constructor.name).toEqual('Server');
    expect(typeof server.start).toEqual('function');
  });

  test('should load the GraphQL schema', async () => {
    const antConfig = (new Config({
      basePath: path.resolve(__dirname, '../support/resolvers'),
      plugins: ['$GLOBAL/plugins/graphQL']
    })).config;
    expect.hasAssertions();
    const model = `
      schema {
        query: Query
      }

      type Query {
        foo: String @fooDirective @resolve(to: "resolveFooQuery")
        mocked: String @mock(with: "foo mock value")
        mocked2: String @mock
        mocked3: String @resolve
        mocked4: String @mock(with: "foo mock value1") @mock(with: "foo mock value2")
      }
    `;
    const server = new Server({ antConfig, model });
    expect(await graphql(server._schema, '{ foo }')).toEqual(
      { data: { foo: 'foo resolver value' } }
    );
    expect(await graphql(server._schema, '{ mocked }')).toEqual(
      { data: { mocked: 'foo mock value' } }
    );
    expect(await graphql(server._schema, '{ mocked2 }')).toEqual(
      { data: { mocked2: null } }
    );
    expect(await graphql(server._schema, '{ mocked3 }')).toEqual(
      { data: { mocked3: null } }
    );
    expect(await graphql(server._schema, '{ mocked4 }')).toEqual(
      { data: { mocked4: 'foo mock value1' } }
    );
  });

  test('should fail to load directives if graphQL not loaded', () => {
    const errorHandler = jest.fn();
    logger.attachErrorHandler(errorHandler);
    const model = `
      schema {
        query: Query
      }

      type Query {
        mocked: String @mock(with: "foo mock value")
      }
    `;
    new Server({ model });
    expect(errorHandler).toHaveBeenCalledWith(
      'Could not find "mock" directive'
    );
    logger._errorHandlers.delete(errorHandler);
  });

  test('should show directives loading errors', () => {
    const errorHandler = jest.fn();
    logger.attachErrorHandler(errorHandler);
    new Server({
      antConfig: (new Config({
        plugins: [
          '$GLOBAL/plugins/graphQL',
          path.resolve(
            __dirname,
            '../support/plugins/DirectiveDefinitionErrorPlugin'
          )
        ]
      })).config,
      model: ''
    });
    expect(errorHandler).toHaveBeenCalledWith(
      'There were some errors when loading the GraphQL directives:'
    );
    logger._errorHandlers.delete(errorHandler);
  });

  describe('Server.start', () => {
    test('should start the server', () => {
      const originalLog = console.log;
      console.log = jest.fn();
      const server = new Server();
      server.start();
      expect(server._httpServer).toEqual(expect.any(http.Server));
      expect(server._httpServer.listening).toBeTruthy();
      server._httpServer.close();
      console.log = originalLog;
    });
  });
});
