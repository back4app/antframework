/* eslint-disable no-console */

/**
 * @fileoverview Tests for GraphQL Server - lib/Server.js file.
 */

const http = require('http');
const { graphql } = require('graphql');
const Server = require('../../lib/Server');

describe('GraphQL Server - lib/Server.js', () => {
  test('should export "Server" class', () => {
    const server = new Server();
    expect(server.constructor.name).toEqual('Server');
    expect(typeof server.start).toEqual('function');
  });

  test('should load the GraphQL schema', () => {
    expect.hasAssertions();
    const model = `
      schema {
        query: Query
      }

      type Query {
        fooQuery: String @fooDirective
        mockedQuery: String @mock(with: "foo value")
        mockedQuery2: String @mock
      }
    `;
    const server = new Server({ model });
    expect(graphql(server._schema, '{ fooQuery }')).resolves.toEqual(
      { data: { fooQuery: null } }
    );
    expect(graphql(server._schema, '{ mockedQuery }')).resolves.toEqual(
      { data: { mockedQuery: 'foo value' } }
    );
    expect(graphql(server._schema, '{ mockedQuery2 }')).resolves.toEqual(
      { data: { mockedQuery2: null } }
    );
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
