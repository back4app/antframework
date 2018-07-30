/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Server} class.
 */

const express = require('express');
const { parse, buildASTSchema } = require('graphql');
const graphqlHTTP = require('express-graphql');

/**
 * Represents the GraphQL API server for Ant Framework projects.
 */
class Server {
  constructor(config) {
    /**
     * Contains the server config settings.
     * @type {Object}
     * @private
     */
    this._config = config;

    /**
     * Contains the [Express]{@link https://github.com/expressjs/express/blob/master/lib/application.js}
     * application instance.
     * @type {Object}
     * @private
     */
    this._app = express();

    this._loadApp();
  }

  _loadApp() {
    const model = `directive @mock(with: String) on FIELD_DEFINITION
`
      .concat(this._config.model);

    const astDocument = parse(model);

    const schema = buildASTSchema(astDocument);

    for (const typeName in schema._typeMap) {
      const type = schema._typeMap[typeName];
      for (const fieldName in type._fields) {
        const field = type._fields[fieldName];
        if (field.astNode && field.astNode.directives) {
          for (const directive of field.astNode.directives) {
            if (directive.name.value === 'mock') {
              field.resolve = () => {
                const withArgument = directive.arguments.find(
                  argument => argument.name.value === 'with'
                );
                if (withArgument) {
                  return withArgument.value.value;
                } else {
                  return null;
                }
              };
            }
          }
        }
      }
    }

    this._app.use('/', graphqlHTTP({
      schema,
      graphiql: true
    }));
  }

  /**
   * Starts the server.
   */
  start() {
    const port = this._config.port || 3000;
    this._app.listen(port);
    console.log(
      `GraphQL API server listening for requests on http://localhost:${port}`
    );
  }
}

module.exports = Server;
