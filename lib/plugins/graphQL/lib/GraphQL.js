/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link GraphQL} plugin class.
 */

const Plugin = require('../../Plugin');

/**
 * Represents a plugin containing functionalities to build and run GraphQL APIs
 * with Ant Framework.
 * @extends Plugin
 * @param {!Ant} ant The {@link Ant} framework instance that is loading the
 * plugin.
 */
class GraphQL extends Plugin {}

module.exports = GraphQL;
