/**
 * @fileoverview Defines and exports the {@link Server} class.
 */

const path = require('path');
const express = require('express');
const { parse, buildASTSchema } = require('graphql');
const graphqlHTTP = require('express-graphql');
const { Ant, util } = require('@back4app/antframework');
const { logger } = util;

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

    if (!this._config) {
      this._config = {};
    }

    /**
     * Contains the {@link Ant} instance to be used by this server.
     * @type {Ant}
     * @private
     */
    this._ant = new Ant(this._config.antConfig);

    /**
     * Contains the [GraphQLSchema]{@link https://github.com/graphql/graphql-js/blob/master/src/type/schema.js}
     * that defines the GraphQL model that will be used by this server.
     * @type {Object}
     * @private
     */
    this._schema = null;

    /**
     * Contains the [http.Server]{@link https://nodejs.org/api/http.html#http_class_http_server}
     * created by the Express.js application.
     * @type {Object}
     * @private
     */
    this._httpServer = null;

    /**
     * Contains the [Express.js]{@link https://github.com/expressjs/express/blob/master/lib/application.js}
     * application instance.
     * @type {Object}
     * @private
     */
    this._app = express();

    this._loadApp();
  }

  /**
   * Loads the Express.js app instance.
   * @private
   */
  _loadApp() {
    let model = 'directive @mock(with: String) on FIELD_DEFINITION\n';

    if(this._config.model) {
      model = model.concat(this._config.model);
    }

    const astDocument = parse(model);

    const schema = buildASTSchema(astDocument);

    // This code will be better componentized and improved. Essentially it
    // visits a GraphQL schema and look for each of its types, then each of
    // the fields of the types that were found before and finally each of the
    // directives of the fields that were found before. If it is a "mock"
    // directive, a resolve function is attached to the field.
    for (const typeName in schema._typeMap) {
      const type = schema._typeMap[typeName];
      for (const fieldName in type._fields) {
        const field = type._fields[fieldName];
        if (field.astNode && field.astNode.directives) {
          for (const directive of field.astNode.directives) {
            if (directive.name.value === 'mock') {
              const withArgument = directive.arguments.find(
                argument => argument.name.value === 'with'
              );
              if (withArgument) {
                field.resolve = () => withArgument.value.value;
              }
            } else if (directive.name.value === 'resolve') {
              const toArgument = directive.arguments.find(
                argument => argument.name.value === 'to'
              );
              if (toArgument) {
                const handler = require(
                  path.resolve('./', toArgument.value.value)
                );
                field.resolve = function () {
                  return handler(...arguments);
                };
              }
            }
          }
        }
      }
    }

    this._schema = schema;

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
    this._httpServer = this._app.listen(port);
    logger.log(
      `GraphQL API server listening for requests on http://localhost:${port}`
    );
  }
}

module.exports = Server;
