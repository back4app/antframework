#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * @fileoverview This is the executable bin file for the Ant Framework's Default
 * GraphQL server. It initializes and starts an instance of the {@link Server}
 * class.
 */

const { logger } = require('@back4app/ant-util');
const Server = require('../lib/Server.js');

logger.attachHandler(console.log);
logger.attachErrorHandler(console.error);

const server = new Server(JSON.parse(process.argv.pop()));
server.start();
