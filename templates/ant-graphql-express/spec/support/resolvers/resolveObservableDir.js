/**
 * @fileoverview Defines and exports a foo resolver that returns an Observable
 * for testing purposes.
 */

const rxjs = require('@back4app/ant-util-rxjs/node_modules/rxjs');

module.exports = () => rxjs.of('observable');
