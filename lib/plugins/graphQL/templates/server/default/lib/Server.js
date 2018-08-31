/**
 * @fileoverview Defines and exports the {@link Server} class.
 */

const express = require('express');
const graphqlHTTP = require('express-graphql');
const { Ant, util } = require('@back4app/antframework');
const { logger } = util;
const schemaHelper = require(
  '@back4app/antframework/lib/plugins/graphQL/lib/util/schemaHelper'
);

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
     * Contains the {@link GraphQL} plugin instance to be used by this server.
     * @type {Ant}
     * @private
     */
    this._graphQL = this._ant.pluginController.getPlugin('GraphQL');

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
    const schema = schemaHelper.generateSchema(
      this._ant,
      this._graphQL,
      this._config.model
    );

    if (schema) {
      this._schema = schema;

      this._app.use('/', graphqlHTTP({
        schema,
        graphiql: true
      }));
    } else {
      logger.error('Could not load the GraphQL API because the model is empty');
    }

    if (
      this._graphQL &&
      this._graphQL.directiveController.loadingErrors.length
    ) {
      logger.error(
        'There were some errors when loading the GraphQL directives:'
      );
      for (
        const loadingError of this._graphQL.directiveController.loadingErrors
      ) {
        logger.error(loadingError);
      }
    }
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
