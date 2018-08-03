#!/usr/bin/env node

/**
 * @fileoverview This is the executable bin file for the Ant Framework's Default
 * GraphQL server. It initializes and starts an instance of the {@link Server}
 * class.
 */

const Server = require('../lib/Server.js');

const server = new Server(JSON.parse(process.argv.pop()));
server.start();
