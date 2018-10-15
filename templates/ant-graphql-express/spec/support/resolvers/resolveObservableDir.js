/**
 * @fileoverview Defines and exports a foo resolver that returns an Observable
 * for testing purposes.
 */

const rxjs = require('rxjs');

module.exports = () => rxjs.of('observable');
